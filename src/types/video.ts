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
