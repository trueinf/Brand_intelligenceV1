/**
 * Campaign generation graph: brief → creative prompts → branch by mode → image OR video.
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { CampaignGenerationStateAnnotation } from "./campaign-generation-state";
import type { CampaignGenerationInput, CampaignGenerationMode } from "./campaign-generation-state";
import {
  campaignStrategistNode,
  creativePromptBuilderNode,
  adImageGenerationNode,
  adVideoGenerationNode,
} from "./campaign-generation-nodes";

function routeByMode(state: { mode: CampaignGenerationMode }): "ad_image_generation_node" | "ad_video_generation_node" {
  return state.mode === "image" ? "ad_image_generation_node" : "ad_video_generation_node";
}

const workflow = new StateGraph(CampaignGenerationStateAnnotation)
  .addNode("campaign_strategist_node", campaignStrategistNode)
  .addNode("creative_prompt_builder_node", creativePromptBuilderNode)
  .addNode("ad_image_generation_node", adImageGenerationNode)
  .addNode("ad_video_generation_node", adVideoGenerationNode)
  .addEdge(START, "campaign_strategist_node")
  .addEdge("campaign_strategist_node", "creative_prompt_builder_node")
  .addConditionalEdges("creative_prompt_builder_node", routeByMode, {
    ad_image_generation_node: "ad_image_generation_node",
    ad_video_generation_node: "ad_video_generation_node",
  })
  .addEdge("ad_image_generation_node", END)
  .addEdge("ad_video_generation_node", END);

export const campaignGenerationGraph = workflow.compile();

export async function runCampaignGenerationGraph(
  input: CampaignGenerationInput,
  mode: CampaignGenerationMode,
  jobId?: string | null
): Promise<{
  brief: import("@/types/campaign").CampaignBrief | null;
  adImages: import("@/types/campaign").GeneratedAdImage[];
  videoUrl: string | null;
  error: string | null;
}> {
  const initialState = {
    jobId: jobId ?? null,
    input,
    mode,
    campaignBrief: null,
    creativePrompts: null,
    adImages: [],
    videoUrl: null,
    error: null,
  };
  const final = await campaignGenerationGraph.invoke(initialState);
  return {
    brief: final.campaignBrief ?? null,
    adImages: final.adImages ?? [],
    videoUrl: final.videoUrl ?? null,
    error: final.error ?? null,
  };
}
