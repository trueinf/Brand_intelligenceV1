/**
 * Build the layout plan output from mode and input.
 */

import {
  MODE_SCALE,
  MODE_PLACEMENT,
  MODE_ATTENTION_FLOW,
  MODE_TEXT_DENSITY,
  VISUAL_PRIORITY_ORDER,
  type HierarchyMode,
} from "./constants";
import type { VisualHierarchyInput } from "./types";
import { detectHierarchyMode } from "./mode-detection";

export type ScalePlan = {
  product: number;
  headline: number;
  subline: number;
  cta: number;
  logo: number;
};

export type PlacementPlan = {
  product: string;
  headline: string;
  copyBlockAlignment: string;
  cta: string;
  logo: string;
};

export type VisualHierarchyOutput = {
  mode: HierarchyMode;
  attentionFlow: string;
  scale: ScalePlan;
  placement: PlacementPlan;
  textDensity: "minimal" | "balanced" | "bold";
  visualPriorityOrder: string[];
};

function mid(range: [number, number]): number {
  return Math.round((range[0] + range[1]) / 2);
}

export function getLayoutPlan(input: VisualHierarchyInput): VisualHierarchyOutput {
  const mode = detectHierarchyMode(input.brandData, input.campaignData);
  const scaleRanges = MODE_SCALE[mode];
  const placement = MODE_PLACEMENT[mode];

  return {
    mode,
    attentionFlow: MODE_ATTENTION_FLOW[mode],
    scale: {
      product: mid(scaleRanges.product),
      headline: mid(scaleRanges.headline),
      subline: mid(scaleRanges.subline),
      cta: mid(scaleRanges.cta),
      logo: mid(scaleRanges.logo),
    },
    placement: {
      product: placement.product,
      headline: placement.headline,
      copyBlockAlignment: placement.copyBlockAlignment,
      cta: placement.cta,
      logo: placement.logo,
    },
    textDensity: MODE_TEXT_DENSITY[mode],
    visualPriorityOrder: [...VISUAL_PRIORITY_ORDER],
  };
}
