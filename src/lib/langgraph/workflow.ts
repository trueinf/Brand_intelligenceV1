/**
 * Workflow entry point. Executes LangGraph and returns UI-ready JSON.
 *
 * Default: full workflow (synthetic_data including traffic_trend). Chart uses
 * synthetic trend; if missing/empty, the frontend passes [] and the chart shows
 * its built-in fallback.
 *
 * Optional: set ENABLE_GOOGLE_TRENDS=true and SERPAPI_KEY to use real Google
 * Trends data for traffic_trend instead of synthetic.
 *
 * Fast path (FAST_ANALYSIS=true or Netlify): mock data + 2 LLM calls only.
 */

import { normalizeBrandInput } from "@/agents/brand-input-agent";
import { getMockSemrushData } from "@/agents/mock-data-agent";
import {
  buildCampaignUserPrompt,
  CAMPAIGN_SYSTEM_PROMPT,
  type CampaignAgentOutput,
} from "@/agents/campaign-agent";
import {
  buildInsightUserPrompt,
  INSIGHT_SYSTEM_PROMPT,
} from "@/agents/insight-agent";
import { callClaudeJson } from "@/lib/claude/client";
import { runBrandCampaignWorkflow } from "@/langgraph/graph";
import type {
  AnalyzeBrandResponse,
  Insights,
  SyntheticData,
  TrafficTrendPoint,
} from "@/types";

export { runBrandCampaignWorkflow } from "@/langgraph/graph";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateToMonthLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const m = d.getMonth();
    return MONTH_LABELS[m] ?? dateStr.slice(0, 3);
  } catch {
    return dateStr.slice(0, 3);
  }
}

/** Fast path: no Clearbit/SerpAPI/Google Trends, mock data + 2 Claude calls. Use when FAST_ANALYSIS=true (e.g. Netlify). */
export async function executeWorkflowFast(
  brandInput: string
): Promise<{ success: true; data: AnalyzeBrandResponse } | { success: false; error: string }> {
  try {
    const brand = normalizeBrandInput(brandInput.trim());
    if (!brand) return { success: false, error: "Invalid brand input" };
    const mock = getMockSemrushData(brand);

    const campaignOut = await callClaudeJson<CampaignAgentOutput>({
      systemPrompt: CAMPAIGN_SYSTEM_PROMPT,
      userPrompt: buildCampaignUserPrompt(brand.brand_name, brand.domain, mock),
    });
    const { brand_overview, campaigns } = campaignOut;
    if (!brand_overview || !campaigns?.length) {
      return { success: false, error: "Campaign generation returned no data" };
    }

    const insightOut = await callClaudeJson<{ insights: Insights }>({
      systemPrompt: INSIGHT_SYSTEM_PROMPT,
      userPrompt: buildInsightUserPrompt(
        mock.domain_overview as unknown as Record<string, unknown>,
        mock.competitors as unknown as Record<string, unknown>[],
        campaigns.map((c) => ({
          campaign_name: c.campaign_name,
          campaign_type: c.campaign_type,
          traffic_share: c.traffic_share,
          success_score: c.success_score,
        }))
      ),
    });
    const insights = insightOut.insights;
    if (!insights) return { success: false, error: "Insight generation returned no data" };

    const do_ = mock.domain_overview;
    const totalTraffic = (do_.organicTraffic ?? 0) + (do_.paidTraffic ?? 0) || 1;
    const organicPct = (do_.organicTraffic ?? 0) / totalTraffic;
    const channel_mix = {
      organic: Math.round(organicPct * 82),
      paid: Math.round((1 - organicPct) * 82),
      social: 10,
      direct: 8,
    };

    const traffic_trend: TrafficTrendPoint[] = (mock.traffic_trend ?? []).map((p) => ({
      ...p,
      month: p.month ?? dateToMonthLabel((p.date ?? "").toString()),
    }));

    const synthetic_data: SyntheticData = {
      domain_overview: {
        authority_score: Math.min(10, Math.max(1, Math.round(10 - (do_.globalRank ?? 10000) / 5000))),
        organic_traffic: do_.organicTraffic ?? 0,
        paid_traffic: do_.paidTraffic ?? 0,
        backlink_count: (do_.organicKeywords ?? 0) * 15,
        top_country: "US",
      },
      channel_mix,
      paid_keywords: (mock.paid_keywords ?? []).slice(0, 12).map((k, i) => ({
        keyword: k.keyword,
        volume: k.volume,
        cpc: k.cpc,
        traffic_share: 8 + (i % 12),
      })),
      organic_keywords: (mock.organic_keywords ?? []).slice(0, 12).map((k) => ({
        keyword: k.keyword,
        volume: k.volume,
        position: k.position,
        traffic_share: k.trafficShare ?? 10,
      })),
      competitors: (mock.competitors ?? []).map((c) => ({
        domain: c.domain,
        traffic: c.organicTraffic,
        overlap: c.overlap,
        overlap_score: c.overlap,
      })),
      traffic_trend,
      campaign_timeline: [],
    };

    const data: AnalyzeBrandResponse = {
      brand_overview,
      brand_context: null,
      campaigns,
      insights,
      traffic_trend: traffic_trend.length > 0 ? traffic_trend : undefined,
      synthetic_data,
    };
    return { success: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Fast analysis failed";
    return { success: false, error: message };
  }
}

export async function executeWorkflow(
  brandInput: string
): Promise<{ success: true; data: AnalyzeBrandResponse } | { success: false; error: string }> {
  const useFast =
    process.env.FAST_ANALYSIS === "true" ||
    typeof process.env.NETLIFY_SITE_NAME !== "undefined" ||
    (typeof process.env.URL === "string" && process.env.URL.includes("netlify.app"));
  if (useFast) {
    return executeWorkflowFast(brandInput);
  }
  const state = await runBrandCampaignWorkflow(brandInput);
  if (state.error) {
    return { success: false, error: state.error };
  }
  if (!state.result) {
    return { success: false, error: "No result from workflow" };
  }
  return { success: true, data: state.result };
}
