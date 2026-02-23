/**
 * Maps /api/analyze-brand response to DashboardData. Used by dashboard context.
 */

import type { AnalyzeBrandResponse } from "@/types";
import type { DashboardData, StrategyInsightItem } from "@/types/dashboard";
import { getMockDashboardData } from "./mock-dashboard-data";

function toInsightItems(
  items: string[] | StrategyInsightItem[],
  defaultPriority: StrategyInsightItem["priority"] = "medium"
): StrategyInsightItem[] {
  return items.map((item) =>
    typeof item === "string" ? { text: item, priority: defaultPriority } : item
  );
}

export function apiToDashboardData(api: AnalyzeBrandResponse, brandName?: string): DashboardData {
  const base = getMockDashboardData(brandName ?? api.brand_overview.name);

  const insights = api.insights;
  const strategyPanel: DashboardData["strategyPanel"] = {
    whatsWorking: insights?.strategic_summary
      ? toInsightItems([insights.strategic_summary, insights.channel_strategy_summary ?? ""].filter(Boolean), "high")
      : base.strategyPanel.whatsWorking,
    whatsMissing: insights?.geo_opportunities?.length
      ? toInsightItems(insights.geo_opportunities as unknown as string[], "medium")
      : base.strategyPanel.whatsMissing,
    recommendedActions: insights?.content_strategy_focus
      ? toInsightItems([insights.content_strategy_focus], "high")
      : base.strategyPanel.recommendedActions,
  };

  const campaignThemes = api.campaigns?.length
    ? api.campaigns.slice(0, 5).map((c, i) => ({
        id: String(i + 1),
        campaignType: c.campaign_type,
        channel: "Paid Search",
        goal: c.objective,
        status: "Active" as const,
        objective: c.objective,
        performance: `Traffic share ${c.traffic_share}%`,
        messaging: c.ad_messaging?.headlines ?? [],
      }))
    : base.campaignThemes;

  return {
    ...base,
    brandName: api.brand_overview.name,
    dateRange: base.dateRange,
    brandDNA: {
      ...base.brandDNA,
      marketPosition: insights?.market_position ?? base.brandDNA.marketPosition,
    },
    strengthScore: {
      ...base.strengthScore,
      score: insights?.growth_score ?? base.strengthScore.score,
    },
    messagingStrategy: insights?.strategic_summary ?? base.messagingStrategy,
    strategyPanel,
    campaignThemes,
  };
}
