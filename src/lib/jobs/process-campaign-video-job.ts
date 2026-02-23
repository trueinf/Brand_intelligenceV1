/**
 * Async campaign video job processor.
 * Flow: Gemini video script → OpenAI TTS (base64) → Veo → update job with videoUrl or failed.
 * Validates API keys at start; never leaves job in "running" on failure.
 */

import { updateJob } from "@/lib/jobs/job-store";
import { generateCampaignVideoScriptWithRetry } from "@/lib/agents/gemini-video-script";
import { createVoiceover } from "@/lib/createVoiceover";
import {
  buildVeoPromptFromScript,
  generateCampaignVideoWithRetry,
} from "@/lib/veo/client";
import type { BrandIntelligence } from "@/types/platform";

export interface CampaignVideoJobPayload {
  userInput: string;
  workspaceId?: string;
  dashboardData?: {
    brandOverview?: BrandIntelligence["brandOverview"];
    campaigns?: BrandIntelligence["campaigns"];
    insights?: BrandIntelligence["insights"];
  } | null;
}

function failJob(
  userId: string,
  jobId: string,
  error: string,
  currentStep: string
): Promise<void> {
  return updateJob(userId, jobId, {
    status: "failed",
    progress: 100,
    currentStep,
    error,
  });
}

export async function processCampaignVideoJob(
  userId: string,
  jobId: string,
  payload: CampaignVideoJobPayload
): Promise<void> {
  const setRunning = (step: string, progress: number) =>
    updateJob(userId, jobId, {
      status: "running",
      currentStep: step,
      progress,
      error: undefined,
    });

  try {
    if (!process.env.GEMINI_API_KEY) {
      await failJob(userId, jobId, "GEMINI_API_KEY not set", "config");
      return;
    }
    if (!process.env.OPENAI_API_KEY) {
      await failJob(userId, jobId, "OPENAI_API_KEY not set", "config");
      return;
    }

    await setRunning("video_script", 10);

    const scriptResult = await generateCampaignVideoScriptWithRetry({
      userInput: payload.userInput,
      dashboardData: payload.dashboardData ?? undefined,
    });

    if ("error" in scriptResult) {
      await failJob(
        userId,
        jobId,
        scriptResult.error,
        "video_script"
      );
      return;
    }

    const { script } = scriptResult;
    const narrationText = script.scenes.map((s) => s.text).join(" ");
    if (!narrationText.trim()) {
      await failJob(userId, jobId, "Video script has no narration", "video_script");
      return;
    }

    await setRunning("voiceover", 30);

    let audioBase64: string | undefined;
    try {
      const voiceover = await createVoiceover(narrationText);
      if ("base64" in voiceover) audioBase64 = voiceover.base64;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "TTS failed";
      await failJob(userId, jobId, msg, "voiceover");
      return;
    }

    await setRunning("video_generation", 50);

    const veoPrompt = buildVeoPromptFromScript(script.title, script.scenes);
    const veoResult = await generateCampaignVideoWithRetry(
      veoPrompt,
      audioBase64
    );

    if ("error" in veoResult) {
      await failJob(
        userId,
        jobId,
        veoResult.error,
        "video_generation"
      );
      return;
    }

    await updateJob(userId, jobId, {
      status: "completed",
      progress: 100,
      currentStep: "complete",
      result: { videoUrl: veoResult.videoUrl },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Video generation failed. Try again.";
    await failJob(userId, jobId, message, "video_generation");
  }
}
