/**
 * Campaign generation worker. Runs runCampaignGenerationGraph in the background.
 * Called fire-and-forget from POST /api/generate-campaign.
 */

import { runCampaignGenerationGraph } from "@/langgraph/campaign-generation-graph";
import { getCampaignJob, updateCampaignJob } from "@/lib/campaign-job-store";
import type { CampaignOutput } from "@/types/campaign";

export async function processCampaignJob(jobId: string): Promise<void> {
  try {
    const job = await getCampaignJob(jobId);
    if (!job || job.status !== "queued") return;

    await updateCampaignJob(jobId, { status: "running" });

    const result = await runCampaignGenerationGraph(job.input);

    if (result.error && !result.brief) {
      await updateCampaignJob(jobId, {
        status: "failed",
        error: result.error,
      });
      return;
    }

    const output: CampaignOutput = {
      brief: result.brief!,
      adImages: result.adImages ?? [],
      videoUrl: result.videoUrl ?? null,
      videoError: result.error ?? undefined,
    };

    await updateCampaignJob(jobId, {
      status: "completed",
      output,
    });
    console.log("JOB COMPLETED", jobId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign generation failed";
    console.error("[campaign-worker]", jobId, e);
    await updateCampaignJob(jobId, {
      status: "failed",
      error: message,
    });
  }
}
