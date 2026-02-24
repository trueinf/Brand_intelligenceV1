/**
 * POST /api/generate-campaign
 * Returns immediately with { jobId }. Runs LangGraph in background via worker.
 * No runCampaignGenerationGraph in this route — avoids Netlify 504.
 */

import { NextResponse } from "next/server";
import { createCampaignJob } from "@/lib/campaign-job-store";
import { processCampaignJob } from "@/lib/workers/campaign-worker";
import type { CampaignGenerationInput } from "@/langgraph/campaign-generation-state";

export const maxDuration = 60;

function parseBody(body: unknown): CampaignGenerationInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const brandName = String(b?.brandName ?? "").trim();
  if (!brandName) return null;
  return {
    brandName,
    campaignId: b.campaignId != null ? String(b.campaignId) : undefined,
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

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const input = parseBody(body);
    if (!input) {
      return NextResponse.json(
        { error: "Missing brandName in request body" },
        { status: 400 }
      );
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
        },
        { status: 503 }
      );
    }

    const jobId = await createCampaignJob(input);

    // Temporarily await to confirm worker runs to completion (otherwise may be terminated early on serverless).
    await processCampaignJob(jobId);

    return NextResponse.json({ jobId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to start campaign generation";
    console.error("[generate-campaign]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
