/**
 * Campaign Intelligence Agent: LLM groups paid/organic data into campaigns.
 * Consumes synthetic_data (Phase-2) or legacy mock_data.
 */

import type { SyntheticData, MockSemrushData, Campaign, BrandOverview } from "@/types";

export interface CampaignAgentOutput {
  brand_overview: BrandOverview;
  campaigns: Campaign[];
}

export const CAMPAIGN_SYSTEM_PROMPT = `You are a paid search and organic SEO analyst. Given marketing data (domain overview, keywords, competitors, trend), group paid and organic data into coherent campaigns and return strict JSON only.

Rules:
- Output ONLY valid JSON. No markdown, no code fences.
- campaigns: array of objects. Each campaign has exactly:
  campaign_name (string)
  campaign_type (one of: "product" | "brand" | "performance" | "offer")
  objective (string)
  main_keyword (string)
  cpc (number)
  traffic_share (number 0-100)
  landing_page (string URL)
  ad_messaging: { headlines: string[], descriptions: string[] }
  duration (string e.g. "3 months")
  success_score (number 1-10)
- brand_overview: { name: string, domain: string, summary: string (2-3 sentences), industry?: string }
- Create 3-6 campaigns. traffic_share across campaigns should roughly sum to 100.`;

function serializeSyntheticForPrompt(data: SyntheticData): string {
  return `domain_overview: ${JSON.stringify(data.domain_overview)}
channel_mix: ${JSON.stringify(data.channel_mix)}
paid_keywords (sample): ${JSON.stringify(data.paid_keywords.slice(0, 15))}
organic_keywords (sample): ${JSON.stringify(data.organic_keywords.slice(0, 12))}
competitors: ${JSON.stringify(data.competitors)}
traffic_trend (sample): ${JSON.stringify(data.traffic_trend.slice(-6))}
campaign_timeline: ${JSON.stringify(data.campaign_timeline)}`;
}

export function buildCampaignUserPromptFromSynthetic(
  brandName: string,
  domain: string,
  syntheticData: SyntheticData
): string {
  return `Brand: ${brandName}
Domain: ${domain}

Data:
${serializeSyntheticForPrompt(syntheticData)}

Return a single JSON object with keys: brand_overview, campaigns.`;
}

export function buildCampaignUserPrompt(
  brandName: string,
  domain: string,
  mockData: MockSemrushData
): string {
  return `Brand: ${brandName}
Domain: ${domain}

Data:
domain_overview: ${JSON.stringify(mockData.domain_overview)}
paid_keywords (sample): ${JSON.stringify(mockData.paid_keywords.slice(0, 15))}
organic_keywords (sample): ${JSON.stringify(mockData.organic_keywords.slice(0, 10))}
competitors: ${JSON.stringify(mockData.competitors)}
traffic_trend (last 3): ${JSON.stringify(mockData.traffic_trend.slice(-3))}

Return a single JSON object with keys: brand_overview, campaigns.`;
}
