/**
 * Campaign Creative Brain — prompt template.
 */

import type { CreativeBrainInput } from "@/types/campaign-creative-brain";
import type { VisualStrategy } from "@/lib/creative-strategy/campaignGoalMap";

export const CREATIVE_BRAIN_SYSTEM = `You are the Campaign Creative Brain. You transform structured campaign inputs into complete, ad-agency level creative direction for image generation, poster composition, and video storyboard. You think like a Creative Director + Performance Marketer.

THINKING: 1) FUNNEL STAGE (Awareness/Consideration/Conversion/Retention). 2) CREATIVE OBJECTIVE (feel or do). 3) PRODUCT ROLE (Hero/Lifestyle/Supporting/Background). 4) CORE EMOTION (Luxury/Urgency/Celebration/Performance/Trust/Innovation/Belonging). 5) VISUAL STORY = marketing scene, not generic description.

RULES: Real campaign look. No generic stock. Marketing intent. Product in selling context. Styling matches audience. Layout matches platform.

PLATFORM: Instagram = bold, close-up, emotional, 4:5. LinkedIn = clean, structured, corporate premium. Website hero = wide cinematic. Print = elegant, high negative space.

LUXURY (tone=luxury): golden hour, shallow depth, premium materials, cinematic shadows, editorial styling.

PERFORMANCE (goal=conversion): product hero, high contrast, offer badge, strong CTA, eye-path composition.

Return ONLY valid JSON. No markdown, no code fence. Production-ready.`;

const OUTPUT_SCHEMA = `{
  "creative_strategy": { "funnel_stage": "", "objective": "", "core_emotion": "", "product_role": "", "persona_visual_identity": "", "occasion_story": "" },
  "scene_direction": { "environment": "", "time_of_day": "", "camera_style": "", "composition": "", "lighting": "", "color_grading": "", "depth": "" },
  "subject_direction": { "characters": "", "styling": "", "pose_or_action": "", "interaction_with_product": "" },
  "brand_integration": { "logo_placement": "", "packaging_visibility": "", "brand_color_usage": "" },
  "copy_layout": { "headline_zone": "", "subline_zone": "", "cta_zone": "", "offer_badge_zone": "" },
  "platform_adaptation": { "aspect_ratio": "", "safe_margins": "", "scroll_stop_elements": "" },
  "image_generation_prompt": "",
  "video_storyboard": [ { "scene": "", "duration": "", "visual": "", "motion": "", "copy": "" } ]
}`;

export function buildCreativeBrainPrompt(
  input: CreativeBrainInput,
  visualStrategy?: VisualStrategy
): string {
  const payload = JSON.stringify(
    {
      brand: input.brand,
      product: input.product,
      campaign_goal: input.campaign_goal,
      target_audience: input.target_audience,
      key_message: input.key_message,
      offer: input.offer,
      channel: input.channel,
      visual_tone: input.visual_tone,
      occasion: input.occasion,
      season: input.season,
      brand_kit: input.brand_kit,
    },
    null,
    2
  );
  const strategyBlock = visualStrategy
    ? `\n\nVISUAL_STRATEGY (from campaign goal — use to drive scene_direction, subject_direction, image_generation_prompt, copy_layout):\n${JSON.stringify(visualStrategy, null, 2)}`
    : "";
  return `INPUT (JSON):\n${payload}${strategyBlock}\n\nReturn this exact structure (all keys, string values). video_storyboard: 3-5 beats.\n${OUTPUT_SCHEMA}`;
}
