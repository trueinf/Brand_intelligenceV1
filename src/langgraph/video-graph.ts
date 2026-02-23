/**
 * Video flow: dashboard_data → video_story_node → voiceover_node → scene_visual_node → video_render_node → video_url
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { VideoStateAnnotation } from "./video-state";
import type { VideoState } from "./video-state";
import {
  videoStoryNode,
  voiceoverNode,
  sceneVisualNode,
  videoRenderNode,
} from "./video-nodes";

const videoWorkflow = new StateGraph(VideoStateAnnotation)
  .addNode("video_story_node", videoStoryNode)
  .addNode("voiceover_node", voiceoverNode)
  .addNode("scene_visual_node", sceneVisualNode)
  .addNode("video_render_node", videoRenderNode)
  .addEdge(START, "video_story_node")
  .addEdge("video_story_node", "voiceover_node")
  .addEdge("voiceover_node", "scene_visual_node")
  .addEdge("scene_visual_node", "video_render_node")
  .addEdge("video_render_node", END);

export const videoGraph = videoWorkflow.compile();

export async function runVideoWorkflow(
  dashboardData: VideoState["dashboard_data"],
  options: {
    work_dir: string;
    output_path: string;
  }
): Promise<VideoState> {
  const initialState: VideoState = {
    dashboard_data: dashboardData ?? null,
    video_story: null,
    voiceover_paths: [],
    scene_image_paths: [],
    work_dir: options.work_dir,
    output_path: options.output_path,
    video_url: null,
    scene_urls: [],
    error: null,
  };
  const finalState = await videoGraph.invoke(initialState);
  return finalState as VideoState;
}

export type VideoProgressStatus =
  | "generating_script"
  | "generating_voiceover"
  | "generating_visuals"
  | "rendering_video"
  | "completed";

export async function runVideoWorkflowWithProgress(
  dashboardData: VideoState["dashboard_data"],
  options: {
    work_dir: string;
    output_path: string;
    onProgress: (status: VideoProgressStatus) => void;
  }
): Promise<VideoState> {
  const { videoStoryNode, voiceoverNode, sceneVisualNode, videoRenderNode } = await import("./video-nodes");
  const initialState: VideoState = {
    dashboard_data: dashboardData ?? null,
    video_story: null,
    voiceover_paths: [],
    scene_image_paths: [],
    work_dir: options.work_dir,
    output_path: options.output_path,
    video_url: null,
    scene_urls: [],
    error: null,
  };
  options.onProgress("generating_script");
  let state = { ...initialState };
  let update = await videoStoryNode(state);
  state = { ...state, ...update };
  if (state.error) return state as VideoState;
  options.onProgress("generating_voiceover");
  update = await voiceoverNode(state);
  state = { ...state, ...update };
  if (state.error) return state as VideoState;
  options.onProgress("generating_visuals");
  update = await sceneVisualNode(state);
  state = { ...state, ...update };
  if (state.error) return state as VideoState;
  options.onProgress("rendering_video");
  update = await videoRenderNode(state);
  state = { ...state, ...update };
  options.onProgress("completed");
  return state as VideoState;
}
