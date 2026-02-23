/**
 * Phase-2 flow: brand_input → clearbit_enrichment → synthetic_data → google_trends → serpapi
 * → campaign_intelligence → insight_generation → response_formatter
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { BrandCampaignStateAnnotation } from "./state";
import type { BrandCampaignState } from "./state";
import {
  brandInputNode,
  clearbitEnrichmentNode,
  syntheticDataNode,
  googleTrendsNode,
  serpapiNode,
  campaignIntelligenceNode,
  insightGenerationNode,
  responseFormatterNode,
} from "./nodes";

const workflow = new StateGraph(BrandCampaignStateAnnotation)
  .addNode("brand_input_node", brandInputNode)
  .addNode("clearbit_enrichment_node", clearbitEnrichmentNode)
  .addNode("synthetic_data_node", syntheticDataNode)
  .addNode("google_trends_node", googleTrendsNode)
  .addNode("serpapi_node", serpapiNode)
  .addNode("campaign_intelligence_node", campaignIntelligenceNode)
  .addNode("insight_generation_node", insightGenerationNode)
  .addNode("response_formatter_node", responseFormatterNode)
  .addEdge(START, "brand_input_node")
  .addEdge("brand_input_node", "clearbit_enrichment_node")
  .addEdge("clearbit_enrichment_node", "synthetic_data_node")
  .addEdge("synthetic_data_node", "google_trends_node")
  .addEdge("google_trends_node", "serpapi_node")
  .addEdge("serpapi_node", "campaign_intelligence_node")
  .addEdge("campaign_intelligence_node", "insight_generation_node")
  .addEdge("insight_generation_node", "response_formatter_node")
  .addEdge("response_formatter_node", END);

export const brandCampaignGraph = workflow.compile();

export async function runBrandCampaignWorkflow(
  userInput: string
): Promise<BrandCampaignState> {
  const initialState: BrandCampaignState = {
    input: userInput,
    brand: null,
    brand_context: null,
    mock_data: null,
    synthetic_data: null,
    traffic_trend: [],
    youtube_creatives: [],
    campaigns: [],
    insights: null,
    brand_overview: null,
    result: null,
    error: null,
  };
  const finalState = await brandCampaignGraph.invoke(initialState);
  return finalState as BrandCampaignState;
}
