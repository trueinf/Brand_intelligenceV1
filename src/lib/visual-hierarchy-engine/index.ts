/**
 * Visual Hierarchy Engine for Campaign Studio.
 * Controls attention, scale, placement, and reading flow. Does NOT generate images.
 * Output is a structured layout plan for Poster Composer and Image Generator.
 */

export { getLayoutPlan } from "./layout-plan";
export type {
  VisualHierarchyInput,
  BrandData,
  CampaignData,
  CreativeConcept,
  ImageMeta,
  BrandPositioning,
  ProductRole,
} from "./types";
export type { ScalePlan, PlacementPlan, VisualHierarchyOutput } from "./layout-plan";
export { detectHierarchyMode } from "./mode-detection";
export type { HierarchyMode, AttentionFlowType } from "./constants";
