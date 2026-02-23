/**
 * Video pipeline nodes: video_story_node → voiceover_node → scene_visual_node → video_render_node
 */

import { join } from "node:path";
import {
  getVideoProvider,
  generateVideoStory,
  generateVoiceover,
  generateSceneImage,
} from "@/lib/video-provider";
import { renderVideo } from "@/lib/video-renderer";
import { sceneVisualDescription } from "@/types";
import type { VideoState, VideoStateUpdate } from "./video-state";

// 1. video_story_node: LLM (OpenAI or Gemini) generates scenes from dashboard_data
export async function videoStoryNode(
  state: VideoState
): Promise<VideoStateUpdate> {
  const data = state.dashboard_data;
  if (!data) {
    return { error: "Dashboard data missing" };
  }
  try {
    const story = await generateVideoStory(data);
    if (!story.scenes?.length) {
      return { error: "Video story has no scenes" };
    }
    return { video_story: story, error: null };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Video story generation failed";
    return { error: message };
  }
}

// 2. voiceover_node: TTS per scene (OpenAI or Gemini)
export async function voiceoverNode(
  state: VideoState
): Promise<VideoStateUpdate> {
  const story = state.video_story;
  const workDir = state.work_dir;
  if (!story?.scenes?.length || !workDir) {
    return {
      error: state.error ?? (workDir ? "Video story missing" : "Work dir missing"),
    };
  }
  const provider = getVideoProvider();
  const paths: string[] = [];
  try {
    for (let i = 0; i < story.scenes.length; i++) {
      const path = join(workDir, `voice_${i}.mp3`);
      await generateVoiceover(provider, story.scenes[i].narration, path);
      paths.push(path);
    }
    return { voiceover_paths: paths, error: null };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Voiceover generation failed";
    return { error: message };
  }
}

// 3. scene_visual_node: image per scene (OpenAI or Gemini)
export async function sceneVisualNode(
  state: VideoState
): Promise<VideoStateUpdate> {
  const story = state.video_story;
  const workDir = state.work_dir;
  if (!story?.scenes?.length || !workDir) {
    return { error: state.error ?? "Video story or work dir missing" };
  }
  const provider = getVideoProvider();
  const paths: string[] = [];
  try {
    for (let i = 0; i < story.scenes.length; i++) {
      const desc = sceneVisualDescription(story.scenes[i]);
      if (!desc) {
        return { error: `Scene ${i} has no visual_description` };
      }
      const path = join(workDir, `scene_${i}.png`);
      await generateSceneImage(provider, desc, path);
      paths.push(path);
    }
    return { scene_image_paths: paths, error: null };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Scene image generation failed";
    return { error: message };
  }
}

// 4. video_render_node: ffmpeg combine images + voiceover, zoom/pan, export MP4
export async function videoRenderNode(
  state: VideoState
): Promise<VideoStateUpdate> {
  const story = state.video_story;
  const voicePaths = state.voiceover_paths;
  const imagePaths = state.scene_image_paths;
  const outputPath = state.output_path;
  if (
    !story?.scenes?.length ||
    voicePaths.length !== story.scenes.length ||
    imagePaths.length !== story.scenes.length ||
    !outputPath
  ) {
    return {
      error:
        state.error ??
        "Missing story, voiceover paths, scene images, or output path",
    };
  }
  try {
    await renderVideo(
      {
        imagePaths,
        audioPaths: voicePaths,
        durations: story.scenes.map((s) => s.duration ?? 4),
      },
      outputPath
    );
    return {
      video_url: outputPath,
      scene_urls: [],
      error: null,
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Video render failed (is ffmpeg installed?)";
    return { error: message };
  }
}
