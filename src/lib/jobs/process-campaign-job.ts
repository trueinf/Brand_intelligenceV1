/**
 * Async campaign job processor (user-scoped).
 * Runs image generation in the background; updates job store and workspace version on completion.
 */

import { updateJob, getJob } from "@/lib/jobs/job-store";
import { appendVersion } from "@/lib/campaigns/workspace-store";
import { runCampaignImageWorkflow } from "@/langgraph/campaign-image-graph";
import type { CampaignCreativeInput } from "@/types/platform";

export type CampaignJobPayload = CampaignCreativeInput;

export async function processCampaignJob(
  userId: string,
  jobId: string,
  payload: CampaignJobPayload
): Promise<void> {
  try {
    await updateJob(userId, jobId, {
      status: "running",
      currentStep: "image_generation",
      progress: 20,
      error: undefined,
    });

    const state = await runCampaignImageWorkflow(payload);
    if (state.error) {
      await updateJob(userId, jobId, {
        status: "failed",
        progress: 100,
        currentStep: "image_generation",
        error: state.error,
      });
      return;
    }

    const imageUrl = state.storedUrl ?? state.imageUrl ?? null;
    const images = imageUrl
      ? [{ url: imageUrl, prompt: state.masterPrompt ?? undefined }]
      : [];

    await updateJob(userId, jobId, {
      progress: 65,
      currentStep: "complete",
      result: { images },
    });

    await updateJob(userId, jobId, {
      status: "completed",
      progress: 100,
      currentStep: "complete",
      result: { images },
    });

    const job = await getJob(userId, jobId);
    if (job?.workspaceId) {
      await appendVersion(userId, job.workspaceId, jobId, { images });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign job failed";
    await updateJob(userId, jobId, {
      status: "failed",
      progress: 100,
      currentStep: "image_generation",
      error: message,
    });
  }
}
