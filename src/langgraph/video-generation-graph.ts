/**
 * Graph 2 — Video Generation: video_script_node → voiceover_node → remotion_render_node.
 * Script + voiceover run here; MP4 render is done by POST /api/render-video (bundle + renderMedia).
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { VideoGenerationStateAnnotation } from "./video-generation-state";
import type { VideoGenerationState } from "./video-generation-state";
import type { AnalyzeBrandResponse } from "@/types";
import { videoScriptNode, voiceoverNode, remotionRenderNode } from "./video-generation-nodes";

const workflow = new StateGraph(VideoGenerationStateAnnotation)
  .addNode("video_script_node", videoScriptNode)
  .addNode("voiceover_node", voiceoverNode)
  .addNode("remotion_render_node", remotionRenderNode)
  .addEdge(START, "video_script_node")
  .addEdge("video_script_node", "voiceover_node")
  .addEdge("voiceover_node", "remotion_render_node")
  .addEdge("remotion_render_node", END);

export const videoGenerationGraph = workflow.compile();

export async function runVideoGenerationWorkflow(
  dashboardData: AnalyzeBrandResponse
): Promise<VideoGenerationState> {
  const initialState: VideoGenerationState = {
    dashboard_data: dashboardData,
    video_script: null,
    audioUrl: null,
    videoUrl: null,
    error: null,
  };
  const finalState = await videoGenerationGraph.invoke(initialState);
  return finalState as VideoGenerationState;
}
