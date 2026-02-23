/**
 * Workflow entry point. Executes LangGraph and returns UI-ready JSON.
 * Fast path (FAST_ANALYSIS): mock data + 2 LLM calls, stays under serverless timeout.
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
import type { AnalyzeBrandResponse, Insights } from "@/types";

export { runBrandCampaignWorkflow } from "@/langgraph/graph";

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

    const data: AnalyzeBrandResponse = {
      brand_overview,
      brand_context: null,
      campaigns,
      insights,
      traffic_trend: mock.traffic_trend?.length ? mock.traffic_trend : undefined,
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
  if (process.env.FAST_ANALYSIS === "true") {
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
