import { Annotation } from "@langchain/langgraph";
import type { AnalyzeBrandResponse, VideoStory } from "@/types";

/**
 * State for the video generation pipeline:
 * dashboard_result → video_story_node → voiceover_node → scene_visual_node → video_render_node → video_url
 */
export const VideoStateAnnotation = Annotation.Root({
  dashboard_data: Annotation<AnalyzeBrandResponse | null>(),
  video_story: Annotation<VideoStory | null>(),
  voiceover_paths: Annotation<string[]>(),
  scene_image_paths: Annotation<string[]>(),
  /** Temp directory for voiceover and scene image files (set by API before invoke) */
  work_dir: Annotation<string | null>(),
  /** Absolute path where the final MP4 should be written (set by API) */
  output_path: Annotation<string | null>(),
  video_url: Annotation<string | null>(),
  scene_urls: Annotation<string[]>(),
  error: Annotation<string | null>(),
});

export type VideoState = typeof VideoStateAnnotation.State;
export type VideoStateUpdate = typeof VideoStateAnnotation.Update;
