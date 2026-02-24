/**
 * Map AnalyzeBrandResponse to CampaignGenerationInput.
 * Single source of truth: analyze-brand response is used for both UI and campaign generation.
 */

import type { AnalyzeBrandResponse } from "@/types";
import type { CampaignGenerationInput } from "@/langgraph/campaign-generation-state";

export function mapAnalyzeToCampaignInput(data: AnalyzeBrandResponse): CampaignGenerationInput {
  const overview = data.brand_overview;
  const insights = data.insights;
  const campaigns = data.campaigns ?? [];

  const coreKeywords: string[] = [];
  campaigns.forEach((c) => {
    if (c.main_keyword?.trim()) coreKeywords.push(c.main_keyword.trim());
  });
  if (data.synthetic_data?.paid_keywords?.length) {
    data.synthetic_data.paid_keywords.slice(0, 10).forEach((k) => {
      if (k.keyword?.trim()) coreKeywords.push(k.keyword.trim());
    });
  }
  if (data.synthetic_data?.organic_keywords?.length) {
    data.synthetic_data.organic_keywords.slice(0, 5).forEach((k) => {
      if (k.keyword?.trim()) coreKeywords.push(k.keyword.trim());
    });
  }
  const uniqueKeywords = Array.from(new Set(coreKeywords)).slice(0, 20);

  const intentClusters = campaigns.length
    ? campaigns.slice(0, 5).map((c) => ({
        intent: c.campaign_type ?? "brand",
        keywords: c.main_keyword ? [c.main_keyword] : [],
      }))
    : undefined;

  const campaignsSummary =
    campaigns.length > 0
      ? campaigns.map((c) => `${c.campaign_type ?? "campaign"}: ${c.objective ?? c.campaign_name}`).join("; ")
      : undefined;

  return {
    brandName: overview?.name ?? "",
    brandOverview:
      overview && (overview.name || overview.domain)
        ? {
            name: overview.name ?? "",
            domain: overview.domain ?? "",
            summary: overview.summary ?? undefined,
          }
        : undefined,
    keywordIntelligence:
      uniqueKeywords.length > 0 || intentClusters?.length
        ? { coreKeywords: uniqueKeywords.length > 0 ? uniqueKeywords : undefined, intentClusters }
        : undefined,
    strategyInsights:
      insights && (insights.strategic_summary || insights.market_position != null)
        ? {
            strategic_summary: insights.strategic_summary ?? undefined,
            market_position: insights.market_position ?? undefined,
            growth_score: insights.growth_score ?? undefined,
            channel_strategy_summary: insights.channel_strategy_summary ?? undefined,
          }
        : undefined,
    campaignsSummary,
  };
}
