/**
 * @deprecated Strategy video (Remotion) removed. Use "Generate campaign video" on the home page (Grok) instead.
 * Kept for backward compatibility with video-generation graph and types.
 */

import type { AnalyzeBrandResponse } from "@/types";
import type { VideoScript } from "@/types/video";

export async function createVideoScript(
  _dashboardData: AnalyzeBrandResponse
): Promise<VideoScript> {
  throw new Error(
    "Strategy video is deprecated. Use the home page and click “Generate campaign video” for Grok-generated campaign video."
  );
}
