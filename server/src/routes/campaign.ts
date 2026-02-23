/**
 * POST /generate-campaign — runs runCampaignGenerationGraph, returns CampaignOutput.
 * No timeout limits; intended to run on Render.
 */

import { Request, Response } from "express";
import { runCampaignGenerationGraph } from "../../../src/langgraph/campaign-generation-graph";
import type { CampaignGenerationInput } from "../../../src/langgraph/campaign-generation-state";
import type { CampaignOutput } from "../../../src/types/campaign";

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

export async function handleGenerateCampaign(req: Request, res: Response): Promise<void> {
  const input = parseBody(req.body);
  if (!input) {
    res.status(400).json({ error: "Missing or invalid brandName in request body" });
    return;
  }

  try {
    const result = await runCampaignGenerationGraph(input);

    if (result.error && !result.brief) {
      res.status(422).json({ error: result.error });
      return;
    }

    const output: CampaignOutput = {
      brief: result.brief!,
      adImages: result.adImages ?? [],
      videoUrl: result.videoUrl ?? null,
    };
    res.status(200).json(output);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign generation failed";
    console.error("[generate-campaign]", e);
    res.status(500).json({ error: message });
  }
}
