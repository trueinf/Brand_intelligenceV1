/**
 * Mock brand and keyword data so the platform works without external APIs.
 * Replace with real scrapers/APIs later without changing callers.
 */

import type { BrandIntelligence, KeywordIntelligence, StrategyInsights } from "@/types/platform";
import type { AnalyzeBrandResponse } from "@/types";

const MOCK_BRAND_OVERVIEW = {
  name: "Acme Corp",
  domain: "acme.com",
  summary: "Leading provider of innovative solutions in the B2B SaaS space.",
  industry: "Technology",
};

const MOCK_INSIGHTS: StrategyInsights = {
  growth_score: 72,
  paid_vs_organic_strategy: "Balanced 60/40 paid-organic with strong brand campaigns.",
  market_position: "challenger",
  top_competitors: ["CompetitorA.com", "CompetitorB.com", "CompetitorC.com"],
  top_country: "United States",
  strategic_summary: "Focus on high-intent keywords and thought leadership content to capture demand.",
  marketing_maturity_level: "growth",
  channel_strategy_summary: "Paid search and LinkedIn for demand gen; organic for retention.",
  geo_opportunities: ["UK", "Germany", "APAC"],
  content_strategy_focus: "Product-led content and case studies.",
};

const MOCK_KEYWORD_INTELLIGENCE: KeywordIntelligence = {
  coreKeywords: ["brand name", "product category", "solution type", "industry solution", "enterprise software"],
  intentClusters: [
    { intent: "transactional", keywords: ["buy", "pricing", "demo", "trial"], volume: 12000 },
    { intent: "informational", keywords: ["how to", "guide", "best practices"], volume: 8000 },
    { intent: "branded", keywords: ["acme", "acme corp", "acme software"], volume: 5000 },
  ],
  contentOpportunities: [
    { topic: "Integration guides", keywords: ["api", "integrate", "sso"], priority: "high", rationale: "High volume, low competition" },
    { topic: "ROI calculators", keywords: ["roi", "savings", "calculator"], priority: "medium" },
  ],
  keywordGaps: [
    { keyword: "alternative to [competitor]", competitor: "CompetitorA", opportunity: "Comparison content" },
  ],
};

const MOCK_CAMPAIGNS = [
  {
    campaign_name: "Brand Awareness Q1",
    campaign_type: "brand",
    objective: "Awareness",
    main_keyword: "industry solutions",
    cpc: 4.2,
    traffic_share: 35,
    landing_page: "https://acme.com/solutions",
    duration: "3 months",
    success_score: 78,
  },
  {
    campaign_name: "Demand Gen - Enterprise",
    campaign_type: "performance",
    objective: "Leads",
    main_keyword: "enterprise software",
    cpc: 8.1,
    traffic_share: 45,
    landing_page: "https://acme.com/enterprise",
    duration: "Ongoing",
    success_score: 82,
  },
];

const MOCK_TRAFFIC_TREND = Array.from({ length: 12 }, (_, i) => ({
  month: `2024-${String(i + 1).padStart(2, "0")}`,
  value: 80000 + i * 3000 + Math.random() * 5000,
  organic: 40000 + i * 1500,
  paid: 40000 + i * 1500,
}));

/** Unified dashboard JSON (Brand Intelligence graph output shape). */
export function getMockBrandIntelligence(brandName?: string, domain?: string): BrandIntelligence {
  return {
    brandOverview: {
      ...MOCK_BRAND_OVERVIEW,
      name: brandName ?? MOCK_BRAND_OVERVIEW.name,
      domain: domain ?? MOCK_BRAND_OVERVIEW.domain,
    },
    brandContext: {
      name: brandName ?? MOCK_BRAND_OVERVIEW.name,
      domain: domain ?? MOCK_BRAND_OVERVIEW.domain,
      industry: MOCK_BRAND_OVERVIEW.industry,
      description: MOCK_BRAND_OVERVIEW.summary,
    },
    campaigns: MOCK_CAMPAIGNS,
    insights: MOCK_INSIGHTS,
    trafficTrend: MOCK_TRAFFIC_TREND,
    channelMix: { organic: 45, paid: 40, social: 10, direct: 5 },
  };
}

/** Mock keyword intelligence from "scraped" content and campaign messaging. */
export function getMockKeywordIntelligence(): KeywordIntelligence {
  return { ...MOCK_KEYWORD_INTELLIGENCE };
}

/** Convert to existing AnalyzeBrandResponse shape for compatibility with current dashboard UI. */
export function mockBrandIntelligenceToAnalyzeResponse(
  brandInput: string,
  intelligence?: BrandIntelligence | null
): AnalyzeBrandResponse {
  const data = intelligence ?? getMockBrandIntelligence(brandInput, `${brandInput.toLowerCase().replace(/\s+/g, "")}.com`);
  return {
    brand_overview: {
      name: data.brandOverview.name,
      domain: data.brandOverview.domain,
      summary: data.brandOverview.summary,
      industry: data.brandOverview.industry,
    },
    brand_context: data.brandContext
      ? {
          name: data.brandContext.name,
          domain: data.brandContext.domain,
          industry: data.brandContext.industry,
          description: data.brandContext.description,
        }
      : null,
    campaigns: data.campaigns.map((c) => ({
      campaign_name: c.campaign_name,
      campaign_type: c.campaign_type as "product" | "brand" | "performance" | "offer",
      objective: c.objective,
      main_keyword: c.main_keyword,
      cpc: c.cpc,
      traffic_share: c.traffic_share,
      landing_page: c.landing_page,
      ad_messaging: { headlines: [], descriptions: [] },
      duration: c.duration ?? "",
      success_score: c.success_score ?? 0,
    })),
    insights: data.insights as AnalyzeBrandResponse["insights"],
    synthetic_data: data.trafficTrend || data.channelMix ? {
      domain_overview: {
        authority_score: 65,
        organic_traffic: 50000,
        paid_traffic: 40000,
        backlink_count: 1200,
        top_country: data.insights.top_country,
      },
      channel_mix: data.channelMix ?? { organic: 50, paid: 40, social: 5, direct: 5 },
      paid_keywords: [],
      organic_keywords: [],
      competitors: (data.insights.top_competitors ?? []).map((d) => ({ domain: d, overlap: 0.5 })),
      traffic_trend: (data.trafficTrend ?? []).map((t) => ({ ...t, traffic: t.value })),
      campaign_timeline: [],
    } : null,
    traffic_trend: data.trafficTrend?.map((t) => ({ ...t, traffic: t.value })),
    campaign_timeline: [],
  };
}
