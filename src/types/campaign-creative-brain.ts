/**
 * Campaign Creative Brain — input and output types.
 * Transforms campaign inputs into full creative direction for image, poster, and video.
 */

export type CreativeBrainBrandKit = {
  logo_url?: string;
  colors?: string[];
  fonts?: { headline?: string; body?: string };
  tone?: string;
};

export type CreativeBrainInput = {
  brand: string;
  product: string;
  campaign_goal: string;
  target_audience: string;
  key_message: string;
  offer?: string;
  channel: string;
  visual_tone: string;
  occasion?: string;
  season?: string;
  brand_kit?: CreativeBrainBrandKit;
};

export type CreativeStrategy = {
  funnel_stage: string;
  objective: string;
  core_emotion: string;
  product_role: string;
  persona_visual_identity: string;
  occasion_story: string;
};

export type SceneDirection = {
  environment: string;
  time_of_day: string;
  camera_style: string;
  composition: string;
  lighting: string;
  color_grading: string;
  depth: string;
};

export type SubjectDirection = {
  characters: string;
  styling: string;
  pose_or_action: string;
  interaction_with_product: string;
};

export type BrandIntegration = {
  logo_placement: string;
  packaging_visibility: string;
  brand_color_usage: string;
};

export type CopyLayout = {
  headline_zone: string;
  subline_zone: string;
  cta_zone: string;
  offer_badge_zone: string;
};

export type PlatformAdaptation = {
  aspect_ratio: string;
  safe_margins: string;
  scroll_stop_elements: string;
};

export type VideoStoryboardBeat = {
  scene: string;
  duration: string;
  visual: string;
  motion: string;
  copy: string;
};

export type CreativeBrainOutput = {
  creative_strategy: CreativeStrategy;
  scene_direction: SceneDirection;
  subject_direction: SubjectDirection;
  brand_integration: BrandIntegration;
  copy_layout: CopyLayout;
  platform_adaptation: PlatformAdaptation;
  image_generation_prompt: string;
  video_storyboard: VideoStoryboardBeat[];
};
