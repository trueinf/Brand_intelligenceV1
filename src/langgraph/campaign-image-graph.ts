/**
 * Graph 3 — Campaign Image Generation.
 * campaign_form_input → brand_rule_loader → creative_prompt_builder
 * → image_generation_node → asset_storage_node → END.
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { CampaignImageStateAnnotation } from "./campaign-image-state";
import type { CampaignImageState } from "./campaign-image-state";
import type { CampaignCreativeInput } from "@/types/platform";
import {
  campaignFormInputNode,
  brandRuleLoaderNode,
  creativePromptBuilderNode,
  imageGenerationNode,
  assetStorageNode,
} from "./campaign-image-nodes";

const workflow = new StateGraph(CampaignImageStateAnnotation)
  .addNode("campaign_form_input", campaignFormInputNode)
  .addNode("brand_rule_loader", brandRuleLoaderNode)
  .addNode("creative_prompt_builder", creativePromptBuilderNode)
  .addNode("image_generation_node", imageGenerationNode)
  .addNode("asset_storage_node", assetStorageNode)
  .addEdge(START, "campaign_form_input")
  .addEdge("campaign_form_input", "brand_rule_loader")
  .addEdge("brand_rule_loader", "creative_prompt_builder")
  .addEdge("creative_prompt_builder", "image_generation_node")
  .addEdge("image_generation_node", "asset_storage_node")
  .addEdge("asset_storage_node", END);

export const campaignImageGraph = workflow.compile();

export async function runCampaignImageWorkflow(
  input: CampaignCreativeInput
): Promise<CampaignImageState> {
  const initialState: CampaignImageState = {
    input,
    brandRules: "",
    masterPrompt: "",
    imageUrl: null,
    storedUrl: null,
    error: null,
  };
  const finalState = await campaignImageGraph.invoke(initialState);
  return finalState as CampaignImageState;
}
