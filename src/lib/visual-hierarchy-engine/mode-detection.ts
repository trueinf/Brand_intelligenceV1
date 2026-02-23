/**
 * Determine hierarchy mode from brand, campaign, and concept.
 */

import type { HierarchyMode } from "./constants";
import type { BrandData, CampaignData } from "./types";

function normalize(s: string): string {
  return (s ?? "").toLowerCase().trim();
}

function audienceSuggestsLuxury(audience: string): boolean {
  const a = normalize(audience);
  return (
    a.includes("affluent") ||
    a.includes("premium") ||
    a.includes("collectors") ||
    a.includes("luxury") ||
    a.includes("high-end")
  );
}

function goalSuggestsPerformance(goal: string): boolean {
  const g = normalize(goal);
  return (
    g.includes("conversion") ||
    g.includes("conversions") ||
    g.includes("sales") ||
    g.includes("lead gen") ||
    g.includes("lead generation") ||
    g.includes("shop") ||
    g.includes("offer")
  );
}

function goalSuggestsEditorial(goal: string): boolean {
  const g = normalize(goal);
  return (
    g.includes("awareness") ||
    g.includes("storytelling") ||
    g.includes("brand") ||
    g.includes("positioning")
  );
}

export function detectHierarchyMode(
  brandData: BrandData,
  campaignData: CampaignData
): HierarchyMode {
  const positioning = normalize(brandData.positioning ?? "");
  const audience = normalize(campaignData.audience ?? "");
  const goal = normalize(campaignData.goal ?? "");

  const isLuxuryPositioning = positioning === "luxury";
  const isAffluentAudience = audienceSuggestsLuxury(audience);
  const isPerformanceGoal = goalSuggestsPerformance(goal);
  const isEditorialGoal = goalSuggestsEditorial(goal);

  if ((isLuxuryPositioning || isAffluentAudience) && !isPerformanceGoal) {
    return "luxury";
  }
  if (isPerformanceGoal) {
    return "performance";
  }
  if (isEditorialGoal) {
    return "editorial";
  }

  return "editorial";
}
