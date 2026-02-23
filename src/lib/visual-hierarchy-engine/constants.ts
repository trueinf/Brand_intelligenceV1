/**
 * Scale ranges and placement options per mode.
 */

export type HierarchyMode = "luxury" | "performance" | "editorial";

export const MODE_SCALE: Record<
  HierarchyMode,
  { product: [number, number]; headline: [number, number]; subline: [number, number]; cta: [number, number]; logo: [number, number] }
> = {
  luxury: {
    product: [70, 85],
    headline: [35, 50],
    subline: [25, 35],
    cta: [0, 15],
    logo: [15, 22],
  },
  performance: {
    product: [45, 60],
    headline: [70, 90],
    subline: [55, 70],
    cta: [60, 75],
    logo: [12, 20],
  },
  editorial: {
    product: [60, 75],
    headline: [45, 55],
    subline: [35, 45],
    cta: [40, 55],
    logo: [8, 15],
  },
};

export const MODE_PLACEMENT: Record<
  HierarchyMode,
  {
    product: "center" | "left" | "right" | "rule-of-thirds";
    headline: "top" | "top-left" | "center" | "bottom";
    copyBlockAlignment: "left" | "center" | "right";
    cta: "below-copy" | "floating" | "hidden";
    logo: "bottom-center" | "bottom-left" | "top-right";
  }
> = {
  luxury: {
    product: "center",
    headline: "top",
    copyBlockAlignment: "center",
    cta: "hidden",
    logo: "bottom-center",
  },
  performance: {
    product: "center",
    headline: "top",
    copyBlockAlignment: "left",
    cta: "floating",
    logo: "top-right",
  },
  editorial: {
    product: "rule-of-thirds",
    headline: "bottom",
    copyBlockAlignment: "center",
    cta: "below-copy",
    logo: "bottom-left",
  },
};

export const ATTENTION_FLOWS = ["Z_FLOW", "F_PATTERN", "CENTER_FOCUS", "PYRAMID_FOCUS"] as const;
export type AttentionFlowType = (typeof ATTENTION_FLOWS)[number];

export const MODE_ATTENTION_FLOW: Record<HierarchyMode, AttentionFlowType> = {
  luxury: "CENTER_FOCUS",
  performance: "F_PATTERN",
  editorial: "Z_FLOW",
};

export const MODE_TEXT_DENSITY: Record<HierarchyMode, "minimal" | "balanced" | "bold"> = {
  luxury: "minimal",
  performance: "bold",
  editorial: "balanced",
};

export const VISUAL_PRIORITY_ORDER = ["product", "headline", "value", "cta", "logo"] as const;
