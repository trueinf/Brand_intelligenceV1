/**
 * Structured visual spec for campaign creatives.
 * Drives scene, emotion, product role, styling, lighting, copy zones, and format.
 */

export type VisualSpec = {
  /** Scene description: setting, action, environment */
  visual_scene: string;
  /** Emotional goal: e.g. celebration, exclusivity, confidence */
  emotional_goal: string;
  /** How the product appears: hero, subtle, in-use, etc. */
  product_role: string;
  /** Audience styling: who is in frame, how they're dressed, vibe */
  audience_styling: string;
  /** Lighting: golden hour, cool blue, rim light, etc. */
  lighting_style: string;
  /** Where copy goes: e.g. "top for headline, bottom for CTA" */
  copy_zones: string;
  /** Aspect / platform: "1:1", "16:9", "4:5", "9:16", etc. */
  platform_ratio: string;
};

/** Platform ratio to supported image API size (width x height). */
export const PLATFORM_RATIO_TO_SIZE: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1536, height: 1024 },
  "9:16": { width: 1024, height: 1536 },
  "4:5": { width: 1024, height: 1536 },
  "5:4": { width: 1536, height: 1024 },
};
