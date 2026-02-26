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

/** URL may be undefined until asset is ready (enables compile-time guards for download). */
export type AssetDownloadUrl = string | undefined;

export interface GeneratedAdImage {
  type: AdCreativeType;
  /** Present when asset is ready; undefined = not ready (disable download, show "Asset not ready"). */
  url?: AssetDownloadUrl;
}

/** Precomputed campaign brain for fast video (no strategist/creative rerun). */
export type CampaignBrain = {
  brief: string;
  audience: string;
  hook: string;
  valueProposition: string;
  visualStyle: string;
  scenes: string[];
  cta: string;
};

/** Backend must always set output.adImages[].url when each image is ready and output.videoUrl when video is ready. */
export interface CampaignOutput {
  brief: CampaignBrief;
  adImages: GeneratedAdImage[];
  videoUrl: string | null;
  /** Set when ad video step failed. */
  videoError?: string | null;
  /** Set when poster/image generation failed. */
  posterError?: string | null;
  /** Stored after strategist+creative for fast video reuse. */
  campaignBrain?: CampaignBrain;
}

/** Progress for campaign generation jobs (overall + optional per-asset). */
export type CampaignJobProgress = {
  overallPercent: number;
  step: string;
  image?: {
    percent: number;
    step: string;
  };
  video?: {
    percent: number;
    step: string;
  };
};

/** Single asset generation job in per-campaign history (multi-version support). */
export type AssetVersionStatus = "queued" | "running" | "completed" | "failed";

export interface AssetVersion {
  jobId: string;
  version: number;
  mode: "image" | "video";
  status: AssetVersionStatus;
  createdAt: number;
  progress?: CampaignJobProgress;
  output?: CampaignOutput;
  error?: string;
}
