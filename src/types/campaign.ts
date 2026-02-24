/**
 * Types for AI-generated, data-driven campaign pipeline.
 */

export interface CampaignBrief {
  objective: string;
  targetAudience: string;
  funnelStage: string;
  keyMessage: string;
  valueProposition: string;
  emotionalHook: string;
  primaryChannel: string;
  visualStyle: string;
  callToAction: string;
  campaignConcept: string;
}

/** Single scene in a video plan (hook, problem, value, proof, CTA). */
export interface VideoScene {
  id: string;
  label: string;
  text: string;
  visualHint: string;
}

/** Creative-director output: one video scene spec (camera, lighting, emotion). */
export interface VideoSceneSpec {
  scene: string;
  description: string;
  visualDirection: string;
  camera: string;
  lighting: string;
  emotion: string;
}

/** Raw creative director JSON output (imagePrompt + videoScenes). */
export interface CreativeDirectorOutput {
  imagePrompt: string;
  videoScenes: VideoSceneSpec[];
}

/** Video scene plan: hook → problem → value → proof → CTA. */
export interface VideoScenePlan {
  title: string;
  scenes: VideoScene[];
}

export interface CampaignCreativePrompts {
  imagePrompt: string;
  videoScenePlan: VideoScenePlan;
}

/** Ad creative types for image generation. */
export type AdCreativeType = "social_post" | "banner" | "product_focus";

export interface GeneratedAdImage {
  type: AdCreativeType;
  url: string;
}

export interface CampaignOutput {
  brief: CampaignBrief;
  adImages: GeneratedAdImage[];
  videoUrl: string | null;
  /** Set when ad video step failed (e.g. Runway API error). */
  videoError?: string | null;
}
