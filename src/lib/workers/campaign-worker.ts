/**
 * Campaign generation worker. Runs strategist + creative prompt builder, then
 * image and/or video flows (in parallel when mode is "both").
 * Called fire-and-forget from POST /api/generate-campaign.
 */

import type { CampaignGenerationState, CampaignGenerationUpdate } from "@/langgraph/campaign-generation-state";
import {
  campaignStrategistNode,
  creativePromptBuilderNode,
  adImageGenerationNode,
  adVideoGenerationNode,
} from "@/langgraph/campaign-generation-nodes";
import { getCampaignJob, updateCampaignJob, updateCampaignJobProgress, updateAssetProgress } from "@/lib/campaign-job-store";
import { getCampaignBrain } from "@/lib/campaign-brain-store";
import { buildVideoPrompt } from "@/lib/ai/buildVideoPrompt";
import { stateToCampaignBrain, brainToBrief } from "@/lib/campaignBrain";
import { generateVideoFromPrompt } from "@/lib/xai-video";
import type { CampaignOutput } from "@/types/campaign";

const IMAGE_JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 min for posters (3 images; OpenAI can be slow)
const VIDEO_JOB_TIMEOUT_MS = 45 * 60 * 1000; // 45 min for Grok video (align with xai-video POLL_TIMEOUT)
const BOTH_JOB_TIMEOUT_MS = Math.max(IMAGE_JOB_TIMEOUT_MS, VIDEO_JOB_TIMEOUT_MS);

const REQUIRED_ENV = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "OPENAI_API_KEY",
  "XAI_API_KEY",
];

function withTimeout<T>(promise: Promise<T>, ms: number, jobId: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Generation timed out after ${ms / 60000} minutes. Please try again.`));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

function mergeState(state: CampaignGenerationState, update: CampaignGenerationUpdate): CampaignGenerationState {
  return { ...state, ...update };
}

export async function processCampaignJob(jobId: string): Promise<void> {
  console.log("[campaign-worker] WORKER STARTED", jobId);

  try {
    const job = await getCampaignJob(jobId);
    if (!job || job.status !== "queued") {
      return;
    }

    for (const key of REQUIRED_ENV) {
      if (!process.env[key]) {
        await updateCampaignJob(jobId, {
          status: "failed",
          error: `Missing required env: ${key}`,
        });
        console.error("[campaign-worker] JOB FAILED", jobId, new Error(`Missing required env: ${key}`));
        return;
      }
    }

    await updateCampaignJob(jobId, { status: "running" });

    const mode = job.mode ?? "video";

    if (mode === "video-fast") {
      if (!job.input.campaignBrainId) {
        await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" });
        await updateCampaignJob(jobId, {
          status: "failed",
          error: "video-fast requires campaignBrainId. Run a full campaign first.",
        });
        console.error("[campaign-worker] JOB FAILED", jobId, "Missing campaignBrainId");
        return;
      }
      let brain = await getCampaignBrain(job.input.campaignBrainId);
      if (brain) {
        console.log("[campaign-worker] FAST VIDEO PATH", jobId);
        console.log("[campaign-worker] USING PRECOMPUTED BRAIN");
      } else {
        const brainJob = await getCampaignJob(job.input.campaignBrainId);
        brain = brainJob?.output?.campaignBrain ?? null;
        if (brain) {
          console.log("[campaign-worker] FAST VIDEO PATH", jobId);
          console.log("[campaign-worker] USING STORED BRAIN");
        }
      }
      if (!brain) {
        await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" });
        await updateCampaignJob(jobId, {
          status: "failed",
          error: "Campaign brain not found. Run brand analysis or a full campaign first.",
        });
        console.error("[campaign-worker] JOB FAILED", jobId, "No campaignBrain for", job.input.campaignBrainId);
        return;
      }
      await updateCampaignJobProgress(jobId, { overallPercent: 10, step: "Preparing video" });
      try {
        console.log("[campaign-worker] BUILDING VIDEO PROMPT");
        const prompt = buildVideoPrompt(brain);
        await updateAssetProgress(jobId, "video", 20, "Preparing video");
        console.log("[campaign-worker] SENDING GROK REQUEST");
        const videoUrl = await withTimeout(
          generateVideoFromPrompt(prompt, { maxPromptLength: 1200 }),
          VIDEO_JOB_TIMEOUT_MS,
          jobId
        );
        await updateAssetProgress(jobId, "video", 100, "Video ready");
        const output: CampaignOutput = {
          brief: brainToBrief(brain),
          adImages: [],
          videoUrl,
          campaignBrain: brain,
        };
        await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Completed" });
        await updateCampaignJob(jobId, { status: "completed", output });
        console.log("[campaign-worker] JOB COMPLETED", jobId);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Video generation failed";
        await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" });
        await updateCampaignJob(jobId, {
          status: "failed",
          error: message,
          output: {
            brief: brainToBrief(brain),
            adImages: [],
            videoUrl: null,
            videoError: message,
            campaignBrain: brain,
          },
        });
        console.error("[campaign-worker] JOB FAILED", jobId, e);
      }
      return;
    }

    await updateCampaignJobProgress(jobId, {
      overallPercent: 10,
      step: "Building campaign strategy",
    });

    const effectiveMode: "image" | "video" =
      mode === "both" ? "image" : mode === "video" ? "video" : "image";
    let state: CampaignGenerationState = {
      jobId,
      input: job.input,
      mode: effectiveMode,
      campaignBrief: null,
      creativePrompts: null,
      adImages: [],
      videoUrl: null,
      error: null,
    };

    try {
      const strategistUpdate = await campaignStrategistNode(state);
      state = mergeState(state, strategistUpdate);
      if (state.error || !state.campaignBrief) {
        await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" });
        await updateCampaignJob(jobId, { status: "failed", error: state.error ?? "Strategy failed" });
        console.error("[campaign-worker] JOB FAILED", jobId, state.error);
        return;
      }

      const promptBuilderUpdate = await creativePromptBuilderNode(state);
      state = mergeState(state, promptBuilderUpdate);
      if (state.error || !state.creativePrompts) {
        await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" });
        await updateCampaignJob(jobId, { status: "failed", error: state.error ?? "Creative prompts failed" });
        console.error("[campaign-worker] JOB FAILED", jobId, state.error);
        return;
      }
    } catch (e) {
      console.error("[campaign-worker] GRAPH FAILED", jobId, e);
      const message = e instanceof Error ? e.message : "Campaign generation failed";
      await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" });
      await updateCampaignJob(jobId, { status: "failed", error: message });
      console.error("[campaign-worker] JOB FAILED", jobId, e);
      return;
    }

    const timeoutMs =
      mode === "both" ? BOTH_JOB_TIMEOUT_MS : mode === "image" ? IMAGE_JOB_TIMEOUT_MS : VIDEO_JOB_TIMEOUT_MS;

    const tasks: Promise<{ adImages?: CampaignOutput["adImages"]; videoUrl?: string | null; posterError?: string; videoError?: string }>[] = [];

    if (mode === "image" || mode === "both") {
      tasks.push(
        withTimeout(runImageFlow(jobId, state), timeoutMs, jobId).then(
          (r) => r,
          (e) => ({
            adImages: [],
            posterError: e instanceof Error ? e.message : "Image generation failed",
          })
        )
      );
    }

    if (mode === "video" || mode === "both") {
      tasks.push(
        withTimeout(runVideoFlow(jobId, state), timeoutMs, jobId).then(
          (r) => r,
          (e) => ({
            videoUrl: null,
            videoError: e instanceof Error ? e.message : "Video generation failed",
          })
        )
      );
    }

    const results = await Promise.all(tasks);

    const adImages = results
      .map((r) => r.adImages)
      .filter((a): a is CampaignOutput["adImages"] => Array.isArray(a) && a.length > 0)[0] ?? [];
    const videoUrl = results.map((r) => r.videoUrl).find((v) => v != null) ?? null;
    const posterError = results.map((r) => r.posterError).find(Boolean);
    const videoError = results.map((r) => r.videoError).find(Boolean);

    const brief = state.campaignBrief!;
    const campaignBrain = stateToCampaignBrain(state) ?? undefined;
    const output: CampaignOutput = {
      brief,
      adImages,
      videoUrl,
      videoError: videoError ?? undefined,
      posterError: posterError ?? undefined,
      campaignBrain,
    };

    const anyFailed = posterError != null || videoError != null;
    if (mode !== "both" && anyFailed) {
      await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" });
      await updateCampaignJob(jobId, {
        status: "failed",
        error: posterError ?? videoError ?? "Generation failed",
        output,
      });
      console.error("[campaign-worker] JOB FAILED", jobId, posterError ?? videoError);
      return;
    }

    if (mode === "both" && !adImages.length && !videoUrl) {
      await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" });
      await updateCampaignJob(jobId, {
        status: "failed",
        error: posterError ?? videoError ?? "Generation failed",
        output,
      });
      console.error("[campaign-worker] JOB FAILED", jobId, posterError ?? videoError);
      return;
    }

    await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Completed" });
    await updateCampaignJob(jobId, { status: "completed", output });
    console.log("[campaign-worker] JOB COMPLETED", jobId);
  } catch (e) {
    console.error("[campaign-worker] JOB FAILED", jobId, e);
    const message = e instanceof Error ? e.message : "Unknown error";
    await updateCampaignJobProgress(jobId, { overallPercent: 100, step: "Failed" }).catch(() => {});
    await updateCampaignJob(jobId, { status: "failed", error: message }).catch(() => {});
  }
}

async function runImageFlow(
  jobId: string,
  state: CampaignGenerationState
): Promise<{ adImages: CampaignOutput["adImages"]; posterError?: string }> {
  await updateAssetProgress(jobId, "image", 20, "Preparing posters");
  await updateAssetProgress(jobId, "image", 50, "Generating posters");

  const update = await adImageGenerationNode(state);
  const merged = mergeState(state, update);

  await updateAssetProgress(jobId, "image", 100, "Posters ready");

  if (merged.error) {
    return { adImages: merged.adImages ?? [], posterError: merged.error };
  }
  return { adImages: merged.adImages ?? [] };
}

async function runVideoFlow(
  jobId: string,
  state: CampaignGenerationState
): Promise<{ videoUrl: string | null; videoError?: string }> {
  await updateAssetProgress(jobId, "video", 20, "Preparing video");
  await updateAssetProgress(jobId, "video", 60, "Rendering video");

  const update = await adVideoGenerationNode(state);
  const merged = mergeState(state, update);

  await updateAssetProgress(jobId, "video", 100, "Video ready");

  if (merged.error) {
    return { videoUrl: merged.videoUrl ?? null, videoError: merged.error };
  }
  return { videoUrl: merged.videoUrl ?? null };
}
