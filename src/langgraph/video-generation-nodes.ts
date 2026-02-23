/**
 * Graph 2 — Video Generation: video_script_node (OpenAI) → voiceover_node (OpenAI TTS) → remotion_render_node.
 * Uses existing createVideoScript, createVoiceover; render is done via API (remotion_render_node sets videoUrl when done).
 */

import { createVideoScript } from "@/lib/createVideoScript";
import { createVoiceover } from "@/lib/createVoiceover";
import type { VideoGenerationState, VideoGenerationUpdate } from "./video-generation-state";

export async function videoScriptNode(
  state: VideoGenerationState
): Promise<VideoGenerationUpdate> {
  const data = state.dashboard_data;
  if (!data) return { error: "Dashboard data missing" };
  try {
    const video_script = await createVideoScript(data);
    return { video_script, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Video script generation failed";
    return { error: message };
  }
}

export async function voiceoverNode(
  state: VideoGenerationState
): Promise<VideoGenerationUpdate> {
  const script = state.video_script;
  if (!script?.scenes?.length) return { error: state.error ?? "Video script missing" };
  try {
    const narration = script.scenes.map((s) => s.text).join(" ");
    const voiceover = await createVoiceover(narration);
    const audioUrl = "url" in voiceover ? voiceover.url : `data:audio/mpeg;base64,${voiceover.base64}`;
    return { audioUrl, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Voiceover generation failed";
    return { error: message };
  }
}

/** Remotion render is done server-side via POST /api/render-video. This node only passes through; actual render is triggered by the API. */
export function remotionRenderNode(state: VideoGenerationState): VideoGenerationUpdate {
  return { error: null };
}
