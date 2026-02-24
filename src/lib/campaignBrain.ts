/**
 * Build CampaignBrain from strategist/creative state for storage and fast video reuse.
 * Build minimal CampaignBrief from brain for fast-path job output.
 */

import type { CampaignBrain, CampaignBrief } from "@/types/campaign";
import type { CampaignGenerationState } from "@/langgraph/campaign-generation-state";

export function stateToCampaignBrain(state: CampaignGenerationState): CampaignBrain | null {
  const brief = state.campaignBrief;
  const prompts = state.creativePrompts;
  if (!brief || !prompts?.videoScenePlan?.scenes?.length) return null;

  const scenes = prompts.videoScenePlan.scenes.map(
    (s) => s.text?.trim() || `${s.label}: ${s.visualHint || ""}`.trim() || "Scene"
  );

  return {
    brief: brief.campaignConcept ?? brief.objective ?? "",
    audience: brief.targetAudience ?? "",
    hook: brief.emotionalHook ?? "",
    valueProposition: brief.valueProposition ?? "",
    visualStyle: brief.visualStyle ?? "",
    scenes,
    cta: brief.callToAction ?? "",
  };
}

/** Minimal brief from brain for fast-video job output (API contract). */
export function brainToBrief(brain: CampaignBrain): CampaignBrief {
  return {
    objective: brain.brief,
    targetAudience: brain.audience,
    funnelStage: "awareness",
    keyMessage: brain.valueProposition,
    valueProposition: brain.valueProposition,
    emotionalHook: brain.hook,
    primaryChannel: "video",
    visualStyle: brain.visualStyle,
    callToAction: brain.cta,
    campaignConcept: brain.brief,
  };
}
