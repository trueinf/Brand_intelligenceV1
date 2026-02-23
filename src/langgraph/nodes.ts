/**
 * Phase-2 nodes: brand_input → clearbit_enrichment → synthetic_data → google_trends → serpapi
 * → campaign_intelligence → insight_generation → response_formatter
 */

import { normalizeBrandInput } from "@/agents/brand-input-agent";
import {
  buildSyntheticDataUserPrompt,
  SYNTHETIC_DATA_SYSTEM_PROMPT,
} from "@/agents/synthetic-data-agent";
import {
  buildCampaignUserPromptFromSynthetic,
  buildCampaignUserPrompt,
  CAMPAIGN_SYSTEM_PROMPT,
  type CampaignAgentOutput,
} from "@/agents/campaign-agent";
import {
  buildInsightUserPromptFromSynthetic,
  buildInsightUserPrompt,
  INSIGHT_SYSTEM_PROMPT,
} from "@/agents/insight-agent";
import { getMockSemrushData } from "@/agents/mock-data-agent";
import { callClaudeJson } from "@/lib/claude/client";
import { fetchCompanyByDomain } from "@/lib/clearbit";
import { fetchInterestOverTime } from "@/lib/google-trends";
import { fetchYouTubeVideosForBrand } from "@/lib/serpapi";
import type { BrandCampaignState, BrandCampaignUpdate } from "./state";
import type { Insights, SyntheticData } from "@/types";

// 1️⃣ brand_input_node
export function brandInputNode(state: BrandCampaignState): BrandCampaignUpdate {
  const brand = normalizeBrandInput(state.input || "");
  return { brand, error: null };
}

// 2️⃣ clearbit_enrichment_node
export async function clearbitEnrichmentNode(
  state: BrandCampaignState
): Promise<BrandCampaignUpdate> {
  if (!state.brand) return { error: "Brand missing" };
  const brand_context = await fetchCompanyByDomain(state.brand.domain);
  return { brand_context: brand_context ?? null, error: null };
}

// 3️⃣ synthetic_data_node
export async function syntheticDataNode(
  state: BrandCampaignState
): Promise<BrandCampaignUpdate> {
  if (!state.brand) return { error: "Brand missing" };
  try {
    const out = await callClaudeJson<SyntheticData>({
      systemPrompt: SYNTHETIC_DATA_SYSTEM_PROMPT,
      userPrompt: buildSyntheticDataUserPrompt(
        state.brand.brand_name,
        state.brand.domain,
        state.brand_context
      ),
    });
    const traffic_trend = out.traffic_trend ?? [];
    return { synthetic_data: out, traffic_trend, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Synthetic data generation failed";
    return { error: message };
  }
}

// 4️⃣ google_trends_node (enrich traffic_trend when available)
export async function googleTrendsNode(
  state: BrandCampaignState
): Promise<BrandCampaignUpdate> {
  if (!state.brand) return {};
  const trend = await fetchInterestOverTime(state.brand.brand_name);
  if (trend.length > 0) {
    return { traffic_trend: trend };
  }
  return {};
}

// 5️⃣ serpapi_node (YouTube creatives)
export async function serpapiNode(
  state: BrandCampaignState
): Promise<BrandCampaignUpdate> {
  if (!state.brand) return {};
  const youtube_creatives = await fetchYouTubeVideosForBrand(state.brand.brand_name);
  return { youtube_creatives };
}

// 6️⃣ campaign_intelligence_node — use synthetic_data when present, else mock_data
export async function campaignIntelligenceNode(
  state: BrandCampaignState
): Promise<BrandCampaignUpdate> {
  if (!state.brand) return { error: state.error || "Brand missing" };
  const synthetic = state.synthetic_data;
  const mock = state.mock_data;
  if (!synthetic && !mock) return { error: state.error || "No marketing data (synthetic or mock)" };
  try {
    if (synthetic) {
      const out = await callClaudeJson<CampaignAgentOutput>({
        systemPrompt: CAMPAIGN_SYSTEM_PROMPT,
        userPrompt: buildCampaignUserPromptFromSynthetic(
          state.brand.brand_name,
          state.brand.domain,
          synthetic
        ),
      });
      return { brand_overview: out.brand_overview, campaigns: out.campaigns, error: null };
    }
    const out = await callClaudeJson<CampaignAgentOutput>({
      systemPrompt: CAMPAIGN_SYSTEM_PROMPT,
      userPrompt: buildCampaignUserPrompt(
        state.brand.brand_name,
        state.brand.domain,
        mock!
      ),
    });
    return { brand_overview: out.brand_overview, campaigns: out.campaigns, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign intelligence failed";
    return { error: message };
  }
}

// 7️⃣ insight_generation_node — use synthetic_data when present for extended insights
export async function insightGenerationNode(
  state: BrandCampaignState
): Promise<BrandCampaignUpdate> {
  if (!state.brand_overview || state.campaigns.length === 0) {
    return { error: state.error || "Campaigns or brand overview missing" };
  }
  try {
    if (state.synthetic_data) {
      const { insights } = await callClaudeJson<{ insights: Insights }>({
        systemPrompt: INSIGHT_SYSTEM_PROMPT,
        userPrompt: buildInsightUserPromptFromSynthetic(
          state.synthetic_data,
          state.campaigns.map((c) => ({
            campaign_name: c.campaign_name,
            campaign_type: c.campaign_type,
            traffic_share: c.traffic_share,
            success_score: c.success_score,
          }))
        ),
      });
      return { insights, error: null };
    }
    const mock = state.mock_data!;
    const { insights } = await callClaudeJson<{ insights: Insights }>({
      systemPrompt: INSIGHT_SYSTEM_PROMPT,
      userPrompt: buildInsightUserPrompt(
        mock.domain_overview as unknown as Record<string, unknown>,
        mock.competitors as unknown as Record<string, unknown>[],
        state.campaigns.map((c) => ({
          campaign_name: c.campaign_name,
          campaign_type: c.campaign_type,
          traffic_share: c.traffic_share,
          success_score: c.success_score,
        }))
      ),
    });
    return { insights, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Insight generation failed";
    return { error: message };
  }
}

// 8️⃣ response_formatter_node
export function responseFormatterNode(
  state: BrandCampaignState
): BrandCampaignUpdate {
  if (
    !state.brand_overview ||
    !state.insights ||
    state.campaigns.length === 0
  ) {
    return { error: state.error || "Missing data for response" };
  }
  const traffic_trend =
    state.traffic_trend?.length > 0
      ? state.traffic_trend
      : state.synthetic_data?.traffic_trend;
  const result = {
    brand_overview: state.brand_overview,
    brand_context: state.brand_context ?? undefined,
    campaigns: state.campaigns,
    insights: state.insights,
    synthetic_data: state.synthetic_data ?? undefined,
    youtube_creatives: state.youtube_creatives?.length ? state.youtube_creatives : undefined,
    campaign_timeline: state.synthetic_data?.campaign_timeline,
    traffic_trend: traffic_trend ?? undefined,
  };
  return { result, error: null };
}

// ----- Legacy: mock_data_node (used only if we skip Clearbit/synthetic path) -----
export function mockDataNode(state: BrandCampaignState): BrandCampaignUpdate {
  if (!state.brand) return { error: "Brand missing" };
  const mock_data = getMockSemrushData(state.brand);
  return { mock_data, error: null };
}
