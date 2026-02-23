/**
 * Prompt templates for Campaign Intelligence and Insight agents.
 * Kept separate so they can be tuned or localized without touching graph logic.
 */

import type { MockSemrushData } from "@/types";

const MOCK_DATA_PREVIEW = (data: MockSemrushData) => `
Domain overview: ${JSON.stringify(data.domain_overview, null, 0)}
Paid keywords (sample): ${JSON.stringify(data.paid_keywords.slice(0, 15), null, 0)}
Ad copies: ${JSON.stringify(data.ad_copies, null, 0)}
Paid landing pages: ${JSON.stringify(data.paid_landing_pages, null, 0)}
Organic keywords (sample): ${JSON.stringify(data.organic_keywords.slice(0, 15), null, 0)}
Competitors: ${JSON.stringify(data.competitors, null, 0)}
Traffic trend (last 3 points): ${JSON.stringify(data.traffic_trend.slice(-3), null, 0)}
`;

export const CAMPAIGN_INTELLIGENCE_SYSTEM = `You are a paid search and organic SEO analyst. Given SEMrush-like marketing data for a brand, you group keywords and traffic into coherent campaigns and output structured JSON.

Rules:
- Output ONLY valid JSON. No markdown code fences unless the user asks.
- "campaigns" is an array. Each campaign has: id (short slug), name, type ("paid" | "organic" | "hybrid"), keywords (string[]), trafficShare (number 0-100), summary (string), recommendation (optional string).
- "brand_overview" has: name, domain, summary (2-3 sentences), industry (optional).
- Create 3-6 campaigns that reflect real groupings (e.g. "Branded Paid", "Non-Branded Organic", "Competitor Conquest").
- trafficShare percentages across campaigns should roughly sum to 100.`;

export function campaignIntelligenceUserPrompt(
  brandName: string,
  domain: string,
  mockData: MockSemrushData
): string {
  return `Brand: ${brandName}
Domain: ${domain}

Marketing data:
${MOCK_DATA_PREVIEW(mockData)}

Analyze and return a single JSON object with this exact shape (no other fields):
{
  "brand_overview": {
    "name": string,
    "domain": string,
    "summary": string,
    "industry": string (optional)
  },
  "campaigns": [
    {
      "id": string,
      "name": string,
      "type": "paid" | "organic" | "hybrid",
      "keywords": string[],
      "trafficShare": number,
      "summary": string,
      "recommendation": string (optional)
    }
  ]
}`;
}

export const INSIGHT_AGENT_SYSTEM = `You are a marketing strategist. Given a brand overview and list of campaigns (from a previous analysis), you produce insights as structured JSON.

Rules:
- growthScore: number 0-100 (overall health/growth potential).
- growthScoreLabel: short label like "Strong", "Moderate", "Needs attention".
- paidVsOrganic: 2-4 sentences on paid vs organic strategy and balance.
- marketPosition: 2-3 sentences on market position.
- competitorAnalysis: 2-4 sentences on competitive landscape.
- topOpportunities: optional array of 2-5 short strings.
- risks: optional array of 1-4 short strings.
- Output ONLY valid JSON. No markdown.`;

export function insightAgentUserPrompt(
  brandOverview: { name: string; domain: string; summary: string },
  campaigns: { id: string; name: string; type: string; trafficShare: number; summary: string }[],
  mockData: MockSemrushData
): string {
  return `Brand overview: ${JSON.stringify(brandOverview)}
Campaigns: ${JSON.stringify(campaigns)}

Additional context (traffic/competitors):
Domain overview: ${JSON.stringify(mockData.domain_overview)}
Competitors: ${JSON.stringify(mockData.competitors)}
Traffic trend (last month): ${JSON.stringify(mockData.traffic_trend.slice(-1))}

Return a single JSON object with this exact shape:
{
  "growthScore": number,
  "growthScoreLabel": string,
  "paidVsOrganic": string,
  "marketPosition": string,
  "competitorAnalysis": string,
  "topOpportunities": string[] (optional),
  "risks": string[] (optional)
}`;
}
