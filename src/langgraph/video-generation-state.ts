/**
 * State for Video Generation graph (Graph 2) — script → voiceover → remotion render.
 * Aligns with existing createVideoScript + createVoiceover + render-video API.
 */

import { Annotation } from "@langchain/langgraph";
import type { VideoScript } from "@/types/video";
import type { AnalyzeBrandResponse } from "@/types";

export const VideoGenerationStateAnnotation = Annotation.Root({
  dashboard_data: Annotation<AnalyzeBrandResponse | null>(),
  video_script: Annotation<VideoScript | null>(),
  audioUrl: Annotation<string | null>(),
  videoUrl: Annotation<string | null>(),
  error: Annotation<string | null>(),
});

export type VideoGenerationState = typeof VideoGenerationStateAnnotation.State;
export type VideoGenerationUpdate = typeof VideoGenerationStateAnnotation.Update;
