/**
 * POST /generate-campaign — creates job, runs worker in background, returns { jobId }.
 * GET /campaign-status?jobId= — returns { status, output?, error? } from Redis.
 * Uses same Redis and job schema as Netlify so the dashboard can poll.
 */

import { Request, Response } from "express";
import { createCampaignJob, getCampaignJob } from "@/lib/campaign-job-store";
import { processCampaignJob } from "@/lib/workers/campaign-worker";
import type {
  CampaignGenerationInput,
  CampaignGenerationMode,
} from "@/langgraph/campaign-generation-state";

function parseInput(raw: unknown): CampaignGenerationInput | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const brandName = String(b?.brandName ?? "").trim();
  if (!brandName) return null;
  return {
    brandName,
    campaignId: b.campaignId != null ? String(b.campaignId) : undefined,
    campaignBrainId: b.campaignBrainId != null ? String(b.campaignBrainId) : undefined,
    brandOverview:
      b.brandOverview && typeof b.brandOverview === "object"
        ? {
            name: String((b.brandOverview as Record<string, unknown>).name ?? ""),
            domain: String((b.brandOverview as Record<string, unknown>).domain ?? ""),
            summary:
              (b.brandOverview as Record<string, unknown>).summary != null
                ? String((b.brandOverview as Record<string, unknown>).summary)
                : undefined,
          }
        : undefined,
    keywordIntelligence:
      b.keywordIntelligence && typeof b.keywordIntelligence === "object"
        ? (b.keywordIntelligence as CampaignGenerationInput["keywordIntelligence"])
        : undefined,
    strategyInsights:
      b.strategyInsights && typeof b.strategyInsights === "object"
        ? (b.strategyInsights as CampaignGenerationInput["strategyInsights"])
        : undefined,
    campaignsSummary: b.campaignsSummary != null ? String(b.campaignsSummary) : undefined,
  };
}

export async function handleGenerateCampaign(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown> | undefined;
  const input = parseInput(body?.input ?? body);
  if (!input) {
    res.status(400).json({ error: "Missing or invalid brandName in request body" });
    return;
  }
  const modeRaw = body?.mode != null ? String(body.mode).toLowerCase() : "video";
  const mode: CampaignGenerationMode =
    modeRaw === "image" || modeRaw === "video" || modeRaw === "both" || modeRaw === "video-fast" ? modeRaw : "video";

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    res.status(503).json({ error: "Redis not configured" });
    return;
  }

  try {
    const jobId = await createCampaignJob(input, mode);
    console.log("[generate-campaign] JOB QUEUED", jobId);
    processCampaignJob(jobId).catch((err) => {
      console.error("[generate-campaign] background job error", jobId, err);
    });
    res.status(200).json({ jobId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create campaign job";
    console.error("[generate-campaign]", e);
    res.status(500).json({ error: message });
  }
}

export async function handleGetCampaignStatus(req: Request, res: Response): Promise<void> {
  const jobId = typeof req.query.jobId === "string" ? req.query.jobId.trim() : null;
  if (!jobId) {
    res.status(400).json({ error: "Missing jobId" });
    return;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    res.status(503).json({ error: "Redis not configured" });
    return;
  }

  try {
    const job = await getCampaignJob(jobId);
    if (!job) {
      res.status(404).json({ error: "Job not found", status: null });
      return;
    }
    const payload: { status: string; output?: typeof job.output; error?: string; progress?: typeof job.progress } = {
      status: job.status,
    };
    if (job.output) payload.output = job.output;
    if (job.error) payload.error = job.error;
    if (job.progress) payload.progress = job.progress;
    res.status(200).json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get job status";
    console.error("[campaign-status]", e);
    res.status(500).json({ error: message });
  }
}
