import { inngest } from "@/lib/inngest/client";
import { getPrisma } from "@/lib/db/prisma";
import { executeWorkflow, executeWorkflowFast } from "@/lib/langgraph/workflow";
import { generateCampaignBrain } from "@/lib/campaign-brain/generateCampaignBrain";
import { storeCampaignBrain } from "@/lib/campaign-brain-store";
import type { AnalyzeBrandResponse } from "@/types";

const BRAIN_RACE_MS = 8000;

function isNetlify(): boolean {
  return (
    process.env.NETLIFY === "true" ||
    typeof process.env.NETLIFY_SITE_NAME === "string" ||
    (typeof process.env.URL === "string" && process.env.URL.includes("netlify.app"))
  );
}

type WorkflowOutcome =
  | { success: true; data: AnalyzeBrandResponse }
  | { success: false; error: string };

export const analyzeBrand = inngest.createFunction(
  {
    id: "analyze-brand",
    retries: 2,
  },
  { event: "brand/analyze" },
  async ({ event, step }) => {
    const { jobId, brand, userId } = event.data;
    if (!jobId || typeof brand !== "string") {
      throw new Error("Missing jobId or brand in event data");
    }

    await step.run("mark-processing", async () => {
      await getPrisma().analysisJob.update({
        where: { id: jobId },
        data: { status: "processing", updatedAt: new Date() },
      });
      return { ok: true };
    });

    const outcome = await step.run("run-workflow", async (): Promise<WorkflowOutcome> => {
      const useFast =
        process.env.FAST_ANALYSIS === "true" || isNetlify();
      return useFast ? executeWorkflowFast(brand) : executeWorkflow(brand);
    });

    if (!outcome.success) {
      await step.run("save-failed", async () => {
        await getPrisma().analysisJob.update({
          where: { id: jobId },
          data: {
            status: "failed",
            error: outcome.error,
            result: null,
            updatedAt: new Date(),
          },
        });
        return { ok: true };
      });
      return { status: "failed", error: outcome.error };
    }

    const brainRaceMs = isNetlify() ? 3000 : BRAIN_RACE_MS;
    const brain = await step.run("campaign-brain", async () => {
      const brainPromise = generateCampaignBrain(outcome.data);
      const result = await Promise.race([
        brainPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), brainRaceMs)),
      ]);
      return result;
    });

    const response: AnalyzeBrandResponse & { campaignBrainId?: string } = { ...outcome.data };
    if (brain) {
      try {
        const campaignBrainId = await storeCampaignBrain(brain);
        response.campaignBrainId = campaignBrainId;
      } catch {
        // Redis not configured or store failed
      }
    }

    await step.run("save-result", async () => {
      await getPrisma().analysisJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          result: response as unknown as Record<string, unknown>,
          error: null,
          updatedAt: new Date(),
        },
      });
      return { ok: true };
    });

    return { status: "completed", jobId };
  }
);
