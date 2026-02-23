/**
 * Video pipeline types for script + voiceover (Remotion / InVideo compatible).
 */

export interface VideoScene {
  heading: string;
  text: string;
  visual_hint: string;
}

export interface VideoScript {
  title: string;
  scenes: VideoScene[];
}

/** Type guard: validate API payload so unknown[] can be safely used as VideoScene[]. */
export function isVideoSceneArray(data: unknown): data is VideoScene[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "heading" in item &&
        "text" in item &&
        "visual_hint" in item &&
        typeof (item as VideoScene).heading === "string" &&
        typeof (item as VideoScene).text === "string" &&
        typeof (item as VideoScene).visual_hint === "string"
    )
  );
}
