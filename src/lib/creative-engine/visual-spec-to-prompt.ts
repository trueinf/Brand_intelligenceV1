/**
 * Turn a VisualSpec into a DALL·E-ready image prompt.
 */

import type { VisualSpec } from "@/types/visual-spec";

export function visualSpecToImagePrompt(spec: VisualSpec): string {
  const parts = [
    "Professional commercial photography, magazine-quality.",
    spec.visual_scene,
    `Emotional goal: ${spec.emotional_goal}.`,
    `Product role: ${spec.product_role}.`,
    `Audience and styling: ${spec.audience_styling}.`,
    `Lighting: ${spec.lighting_style}.`,
    `Composition: reserve ${spec.copy_zones}.`,
    "Editorial quality, high dynamic range, ultra realistic. Global brand advertising style. No distorted anatomy, no extra products, no text artifacts, no watermark.",
  ];
  return parts.filter(Boolean).join(" ");
}
