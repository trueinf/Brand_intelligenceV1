/**
 * Generate CampaignBrain from analyze-brand response.
 * Runs ONLY strategist + creative concept logic (no image or video generation).
 */

import type { AnalyzeBrandResponse } from "@/types";
import type { CampaignGenerationState, CampaignGenerationUpdate } from "@/langgraph/campaign-generation-state";
import { campaignStrategistNode, creativePromptBuilderNode } from "@/langgraph/campaign-generation-nodes";
import { mapAnalyzeToCampaignInput } from "@/lib/mapAnalyzeToCampaignInput";
import { stateToCampaignBrain } from "@/lib/campaignBrain";
import type { CampaignBrain } from "@/types/campaign";

function mergeState(state: CampaignGenerationState, update: CampaignGenerationUpdate): CampaignGenerationState {
  return { ...state, ...update };
}

/**
 * Run strategist + creative prompt builder on analyze result; return brain or null.
 */
export async function generateCampaignBrain(analyzeResult: AnalyzeBrandResponse): Promise<CampaignBrain | null> {
  const input = mapAnalyzeToCampaignInput(analyzeResult);
  if (!input.brandName) return null;

  let state: CampaignGenerationState = {
    jobId: null,
    input,
    mode: "video",
    campaignBrief: null,
    creativePrompts: null,
    adImages: [],
    videoUrl: null,
    error: null,
  };

  const strategistUpdate = await campaignStrategistNode(state);
  state = mergeState(state, strategistUpdate);
  if (state.error || !state.campaignBrief) return null;

  const promptBuilderUpdate = await creativePromptBuilderNode(state);
  state = mergeState(state, promptBuilderUpdate);
  if (state.error || !state.creativePrompts) return null;

  return stateToCampaignBrain(state);
}
