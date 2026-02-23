/**
 * Insight Generation Agent: LLM produces strategy insights including maturity and geo.
 */

import type { Insights, SyntheticData, Campaign } from "@/types";

export const INSIGHT_SYSTEM_PROMPT = `You are a marketing strategist. Given domain overview, channel mix, competitors, and campaign summaries, produce insights as strict JSON only.

Rules:
- Output ONLY valid JSON. No markdown, no code fences.
- insights object must include:
  growth_score (number 1-10)
  paid_vs_organic_strategy (string, 2-4 sentences)
  market_position (one of: "leader" | "challenger" | "niche")
  top_competitors (string array)
  top_country (string)
  strategic_summary (string, 2-4 sentences)
  marketing_maturity_level (one of: "starter" | "growth" | "performance_leader")
  channel_strategy_summary (string, 2-3 sentences)
  geo_opportunities (string array, 2-5 opportunity descriptions)
  content_strategy_focus (string, 2-3 sentences)`;

export function buildInsightUserPromptFromSynthetic(
  syntheticData: SyntheticData,
  campaigns: Pick<Campaign, "campaign_name" | "campaign_type" | "traffic_share" | "success_score">[]
): string {
  return `Domain overview: ${JSON.stringify(syntheticData.domain_overview)}
Channel mix: ${JSON.stringify(syntheticData.channel_mix)}
Competitors: ${JSON.stringify(syntheticData.competitors)}
Campaign summaries: ${JSON.stringify(campaigns)}

Return a single JSON object with one key: insights (object with all fields listed in the system prompt).`;
}

export function buildInsightUserPrompt(
  domainOverview: Record<string, unknown>,
  competitors: Record<string, unknown>[],
  campaigns: Pick<Campaign, "campaign_name" | "campaign_type" | "traffic_share" | "success_score">[]
): string {
  return `Domain overview: ${JSON.stringify(domainOverview)}
Competitors: ${JSON.stringify(competitors)}
Campaign summaries: ${JSON.stringify(campaigns)}

Return a single JSON object with one key: insights (object with growth_score, paid_vs_organic_strategy, market_position, top_competitors, top_country, strategic_summary, marketing_maturity_level, channel_strategy_summary, geo_opportunities, content_strategy_focus).`;
}
