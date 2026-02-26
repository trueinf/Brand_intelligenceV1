/**
 * POST /api/generate-campaign
 * Body: { input: CampaignGenerationInput, mode: "image" | "video" }
 * Returns { jobId }. Runs LangGraph in background (image or video branch by mode).
 */

import { NextResponse } from "next/server";
import { createCampaignJob } from "@/lib/campaign-job-store";
import { processCampaignJob } from "@/lib/workers/campaign-worker";
import type {
  CampaignGenerationInput,
  CampaignGenerationMode,
} from "@/langgraph/campaign-generation-state";

export const maxDuration = 60;

const MODES: CampaignGenerationMode[] = ["image", "video"];

function parseInput(raw: unknown): CampaignGenerationInput | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const directPrompt = b.directPrompt != null ? String(b.directPrompt).trim() || undefined : undefined;
  let brandName = String(b?.brandName ?? "").trim();
  if (!brandName && directPrompt) brandName = "Asset Studio";
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
    directPrompt,
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

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const input = parseInput(b.input ?? b);
    if (!input) {
      return NextResponse.json(
        { error: "Missing or invalid input (brandName required)" },
        { status: 400 }
      );
    }
    const modeRaw = b.mode != null ? String(b.mode).toLowerCase() : "video";
    const mode: CampaignGenerationMode =
      modeRaw === "image" || modeRaw === "video" || modeRaw === "both" || modeRaw === "video-fast" ? modeRaw : "video";

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
        },
        { status: 503 }
      );
    }

    const jobId = await createCampaignJob(input, mode);

    processCampaignJob(jobId).catch((err) => {
      console.error("[generate-campaign] background job error", jobId, err);
    });

    return NextResponse.json({ jobId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to start campaign generation";
    console.error("[generate-campaign]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
