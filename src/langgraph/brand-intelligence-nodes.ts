/**
 * Graph 1 — Brand Intelligence: brand_input → data_collection (mock) → keyword_extraction
 * → campaign_detection → brand_perception → strategy_insight → unified dashboard JSON.
 */

import { getMockBrandIntelligence, getMockKeywordIntelligence } from "@/lib/data/mock-brand-data";
import { runKeywordEngine } from "@/lib/brand-engine/keyword-engine";
import { runBrandPerception } from "@/lib/brand-engine/brand-perception";
import { generateBrandInsights } from "@/lib/ai/openai";
import type { BrandIntelligenceState, BrandIntelligenceUpdate } from "./brand-intelligence-state";
import type { BrandIntelligence } from "@/types/platform";

function parseInput(input: string): { brandName: string; domain: string } {
  const trimmed = input.trim();
  const domain = trimmed.includes(".") ? trimmed : `${trimmed.toLowerCase().replace(/\s+/g, "")}.com`;
  const brandName = trimmed;
  return { brandName, domain };
}

export function brandInputNode(state: BrandIntelligenceState): BrandIntelligenceUpdate {
  const { brandName, domain } = parseInput(state.input || "");
  return { brandName, domain, industry: null, error: null };
}

export async function dataCollectionNode(
  state: BrandIntelligenceState
): Promise<BrandIntelligenceUpdate> {
  // Mock: no real scraping; pass through for keyword engine (campaigns come from campaign_detection)
  const mockContent = "SaaS platform, enterprise solutions, cloud software, B2B marketing.";
  const campaignMessaging = ["Brand awareness", "Demand generation", state.brandName];
  return {
    rawData: { websiteContent: mockContent, campaignMessaging },
    error: null,
  };
}

export async function keywordExtractionNode(
  state: BrandIntelligenceState
): Promise<BrandIntelligenceUpdate> {
  const raw = state.rawData;
  const useMock = !raw?.websiteContent;
  const keywordIntelligence = await runKeywordEngine({
    websiteContent: raw?.websiteContent,
    campaignMessaging: raw?.campaignMessaging ?? [],
    useMock,
  });
  return { keywordIntelligence, error: null };
}

export async function campaignDetectionNode(
  state: BrandIntelligenceState
): Promise<BrandIntelligenceUpdate> {
  // Use mock intelligence to get campaigns + insights; keeps flow working without existing graph
  const mock = getMockBrandIntelligence(state.brandName, state.domain);
  return {
    campaigns: mock.campaigns,
    strategyInsights: mock.insights,
    error: null,
  };
}

export async function brandPerceptionNode(
  state: BrandIntelligenceState
): Promise<BrandIntelligenceUpdate> {
  try {
    const perception = await runBrandPerception(
      {
        brandName: state.brandName,
        domain: state.domain,
        industry: state.industry ?? undefined,
        summary: state.strategyInsights?.strategic_summary?.slice(0, 300),
      },
      false
    );
    return {
      brandPerception: {
        brandPersonality: perception.brandPersonality,
        brandPosition: perception.brandPosition,
        brandStrengthScore: perception.brandStrengthScore,
        emotionalTriggers: perception.emotionalTriggers,
      },
      error: null,
    };
  } catch {
    const mock = getMockBrandIntelligence(state.brandName, state.domain);
    return {
      brandPerception: {
        brandPersonality: ["Professional", "Innovative"],
        brandPosition: "Market challenger",
        brandStrengthScore: 70,
        emotionalTriggers: ["Trust", "Growth"],
      },
      error: null,
    };
  }
}

export async function strategyInsightNode(
  state: BrandIntelligenceState
): Promise<BrandIntelligenceUpdate> {
  // If we already have strategyInsights from campaign_detection (mock), keep; else optionally call AI
  const insights = state.strategyInsights;
  if (insights) {
    const mock = getMockBrandIntelligence(state.brandName, state.domain);
    const dashboardJson: BrandIntelligence = {
      brandOverview: mock.brandOverview,
      brandContext: mock.brandContext ?? undefined,
      campaigns: state.campaigns,
      insights: state.strategyInsights,
      trafficTrend: mock.trafficTrend,
      channelMix: mock.channelMix,
    };
    return { dashboardJson, error: null };
  }
  try {
    const { overview, insights: aiInsights } = await generateBrandInsights(
      state.brandName,
      state.domain,
      state.industry ?? undefined
    );
    const dashboardJson: BrandIntelligence = {
      brandOverview: overview,
      brandContext: null,
      campaigns: state.campaigns,
      insights: aiInsights,
      trafficTrend: undefined,
      channelMix: undefined,
    };
    return { strategyInsights: aiInsights, dashboardJson, error: null };
  } catch (e) {
    const mock = getMockBrandIntelligence(state.brandName, state.domain);
    return {
      strategyInsights: mock.insights,
      dashboardJson: mock,
      error: null,
    };
  }
}

export function responseFormatterNode(state: BrandIntelligenceState): BrandIntelligenceUpdate {
  const dashboard = state.dashboardJson ?? getMockBrandIntelligence(state.brandName, state.domain);
  return { dashboardJson: dashboard, error: null };
}
