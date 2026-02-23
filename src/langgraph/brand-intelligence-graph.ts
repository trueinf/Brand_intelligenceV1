/**
 * Graph 1 — Brand Intelligence: returns unified dashboard JSON.
 * brand_input_node → data_collection_node (mock) → keyword_extraction_node
 * → campaign_detection_node → brand_perception_node → strategy_insight_node → END.
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { BrandIntelligenceStateAnnotation } from "./brand-intelligence-state";
import type { BrandIntelligenceState } from "./brand-intelligence-state";
import {
  brandInputNode,
  dataCollectionNode,
  keywordExtractionNode,
  campaignDetectionNode,
  brandPerceptionNode,
  strategyInsightNode,
  responseFormatterNode,
} from "./brand-intelligence-nodes";

const workflow = new StateGraph(BrandIntelligenceStateAnnotation)
  .addNode("brand_input_node", brandInputNode)
  .addNode("data_collection_node", dataCollectionNode)
  .addNode("keyword_extraction_node", keywordExtractionNode)
  .addNode("campaign_detection_node", campaignDetectionNode)
  .addNode("brand_perception_node", brandPerceptionNode)
  .addNode("strategy_insight_node", strategyInsightNode)
  .addNode("response_formatter_node", responseFormatterNode)
  .addEdge(START, "brand_input_node")
  .addEdge("brand_input_node", "data_collection_node")
  .addEdge("data_collection_node", "keyword_extraction_node")
  .addEdge("keyword_extraction_node", "campaign_detection_node")
  .addEdge("campaign_detection_node", "brand_perception_node")
  .addEdge("brand_perception_node", "strategy_insight_node")
  .addEdge("strategy_insight_node", "response_formatter_node")
  .addEdge("response_formatter_node", END);

export const brandIntelligenceGraph = workflow.compile();

export async function runBrandIntelligenceWorkflow(
  userInput: string
): Promise<BrandIntelligenceState> {
  const initialState: BrandIntelligenceState = {
    input: userInput,
    brandName: "",
    domain: "",
    industry: null,
    rawData: null,
    keywordIntelligence: null,
    campaigns: [],
    brandPerception: null,
    strategyInsights: null,
    dashboardJson: null,
    error: null,
  };
  const finalState = await brandIntelligenceGraph.invoke(initialState);
  return finalState as BrandIntelligenceState;
}
