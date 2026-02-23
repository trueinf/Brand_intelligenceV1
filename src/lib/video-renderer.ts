/**
 * Video renderer: delegates to bundled ffmpeg (lib/ffmpeg.ts).
 * Scene images + voiceover → zoom/pan, fade transitions → MP4.
 */

import { renderVideoFromScenes } from "@/lib/ffmpeg";

export interface RenderInput {
  imagePaths: string[];
  audioPaths: string[];
  durations: number[];
}

/**
 * Renders a single MP4 from scene assets. No system ffmpeg; uses bundled binary.
 */
export async function renderVideo(
  input: RenderInput,
  outputPath: string
): Promise<void> {
  await renderVideoFromScenes(
    {
      imagePaths: input.imagePaths,
      audioPaths: input.audioPaths,
      durations: input.durations,
    },
    outputPath
  );
}
