/**
 * Layout presets for platform-ready campaign posters.
 */

import type { PosterLayout } from "@/types/poster";

export type LayoutPresetId = "instagramPost" | "instagramStory" | "webHero" | "displayAd";

export const LAYOUT_PRESETS: Record<LayoutPresetId, PosterLayout> = {
  instagramPost: {
    width: 1080,
    height: 1350,
    safePadding: 48,
    logoPosition: "top",
    textAlignment: "center",
  },
  instagramStory: {
    width: 1080,
    height: 1920,
    safePadding: 56,
    logoPosition: "top",
    textAlignment: "center",
  },
  webHero: {
    width: 1920,
    height: 1080,
    safePadding: 64,
    logoPosition: "top",
    textAlignment: "left",
  },
  displayAd: {
    width: 1200,
    height: 628,
    safePadding: 40,
    logoPosition: "bottom",
    textAlignment: "left",
  },
};

export const LAYOUT_PRESET_LABELS: Record<LayoutPresetId, string> = {
  instagramPost: "Instagram Post",
  instagramStory: "Instagram Story",
  webHero: "Web hero",
  displayAd: "Display ad",
};
