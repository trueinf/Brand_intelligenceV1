/**
 * Visual Hierarchy Engine — input types.
 * Controls attention, scale, placement, and reading flow for high-end ad creatives.
 */

export type BrandPositioning = "luxury" | "modern" | "performance" | "mass";

export type BrandData = {
  name: string;
  category?: string;
  positioning?: BrandPositioning;
};

export type CampaignData = {
  goal: string;
  channel: string;
  audience: string;
  keyMessage: string;
  offer?: string;
  cta?: string;
};

export type ProductRole = "hero" | "support" | "lifestyle";

export type CreativeConcept = {
  mood?: string;
  sceneType?: string;
  productRole?: ProductRole;
};

export type ImageMeta = {
  aspectRatio?: string;
  focalPoint?: string;
  copySafeAreas?: string;
};

export type VisualHierarchyInput = {
  brandData: BrandData;
  campaignData: CampaignData;
  creativeConcept: CreativeConcept;
  imageMeta: ImageMeta;
};
