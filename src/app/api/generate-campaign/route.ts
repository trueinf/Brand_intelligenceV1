/**
 * POST /api/generate-campaign
 * Body: CampaignGenerationInput (brandName, brandOverview?, keywordIntelligence?, strategyInsights?, campaignsSummary?)
 * Invokes campaign_generation_graph, returns CampaignOutput.
 */

import { NextResponse } from "next/server";
import { runCampaignGenerationGraph } from "@/langgraph/campaign-generation-graph";
import type { CampaignGenerationInput } from "@/langgraph/campaign-generation-state";
import type { CampaignOutput } from "@/types/campaign";

export const maxDuration = 120;

function json500(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const input: CampaignGenerationInput = {
      brandName: String(body?.brandName ?? ""),
      brandOverview:
        body?.brandOverview && typeof body.brandOverview === "object"
          ? {
              name: String((body.brandOverview as Record<string, unknown>).name ?? ""),
              domain: String((body.brandOverview as Record<string, unknown>).domain ?? ""),
              summary:
                (body.brandOverview as Record<string, unknown>).summary != null
                  ? String((body.brandOverview as Record<string, unknown>).summary)
                  : undefined,
            }
          : undefined,
      keywordIntelligence:
        body?.keywordIntelligence && typeof body.keywordIntelligence === "object"
          ? (body.keywordIntelligence as CampaignGenerationInput["keywordIntelligence"])
          : undefined,
      strategyInsights:
        body?.strategyInsights && typeof body.strategyInsights === "object"
          ? (body.strategyInsights as CampaignGenerationInput["strategyInsights"])
          : undefined,
      campaignsSummary:
        body?.campaignsSummary != null ? String(body.campaignsSummary) : undefined,
    };

    if (!input.brandName) {
      return NextResponse.json(
        { error: "Missing brandName in request body" },
        { status: 400 }
      );
    }

    let result: Awaited<ReturnType<typeof runCampaignGenerationGraph>>;
    try {
      result = await runCampaignGenerationGraph(input);
    } catch (graphError) {
      const msg =
        graphError instanceof Error ? graphError.message : "Campaign graph failed";
      console.error("[generate-campaign] graph error", graphError);
      return json500(msg);
    }

    if (result.error && !result.brief) {
      return NextResponse.json(
        { error: result.error },
        { status: 422 }
      );
    }

    const output: CampaignOutput = {
      brief: result.brief!,
      adImages: result.adImages ?? [],
      videoUrl: result.videoUrl ?? null,
    };

    return NextResponse.json(output);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign generation failed";
    console.error("[generate-campaign]", message, e);
    return json500(message);
  }
}
