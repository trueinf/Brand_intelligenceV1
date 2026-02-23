/**
 * Campaign Creative Brain — generates full creative direction from campaign input.
 * Uses campaign goal → visual strategy mapping to drive scene_direction, subject_direction, image prompt, poster layout.
 */

import { getOpenAIClient } from "@/lib/openai";
import { getVisualStrategyFromCampaignGoal } from "@/lib/creative-strategy/campaignGoalMap";
import type { CreativeBrainInput, CreativeBrainOutput } from "@/types/campaign-creative-brain";
import { buildCreativeBrainPrompt, CREATIVE_BRAIN_SYSTEM } from "./creative-brain.prompt";

const MODEL = "gpt-4o";

export async function generateCreativeDirection(
  input: CreativeBrainInput
): Promise<CreativeBrainOutput> {
  const strategy = getVisualStrategyFromCampaignGoal(input.campaign_goal);
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    messages: [
      { role: "system", content: CREATIVE_BRAIN_SYSTEM },
      { role: "user", content: buildCreativeBrainPrompt(input, strategy) },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Campaign Creative Brain");
  const parsed = JSON.parse(raw) as CreativeBrainOutput;
  return normalizeOutput(parsed, strategy);
}

function normalizeOutput(
  data: CreativeBrainOutput,
  strategy: ReturnType<typeof getVisualStrategyFromCampaignGoal>
): CreativeBrainOutput {
  return {
    creative_strategy: {
      funnel_stage: data.creative_strategy?.funnel_stage?.trim() || strategy.funnel_stage,
      objective: data.creative_strategy?.objective ?? "",
      core_emotion: data.creative_strategy?.core_emotion?.trim() || strategy.emotion,
      product_role: data.creative_strategy?.product_role?.trim() || strategy.product_role,
      persona_visual_identity: data.creative_strategy?.persona_visual_identity ?? "",
      occasion_story: data.creative_strategy?.occasion_story ?? "",
    },
    scene_direction: {
      environment: data.scene_direction?.environment ?? "",
      time_of_day: data.scene_direction?.time_of_day ?? "",
      camera_style: data.scene_direction?.camera_style?.trim() || strategy.camera_style,
      composition: data.scene_direction?.composition?.trim() || strategy.composition,
      lighting: data.scene_direction?.lighting?.trim() || strategy.lighting_style,
      color_grading: data.scene_direction?.color_grading ?? "",
      depth: data.scene_direction?.depth ?? "",
    },
    subject_direction: {
      characters: data.subject_direction?.characters ?? "",
      styling: data.subject_direction?.styling ?? "",
      pose_or_action: data.subject_direction?.pose_or_action ?? "",
      interaction_with_product: data.subject_direction?.interaction_with_product ?? "",
    },
    brand_integration: {
      logo_placement: data.brand_integration?.logo_placement ?? "",
      packaging_visibility: data.brand_integration?.packaging_visibility ?? "",
      brand_color_usage: data.brand_integration?.brand_color_usage ?? "",
    },
    copy_layout: {
      headline_zone: data.copy_layout?.headline_zone ?? "",
      subline_zone: data.copy_layout?.subline_zone ?? "",
      cta_zone: data.copy_layout?.cta_zone ?? "",
      offer_badge_zone: data.copy_layout?.offer_badge_zone ?? "",
    },
    platform_adaptation: {
      aspect_ratio: data.platform_adaptation?.aspect_ratio ?? "1:1",
      safe_margins: data.platform_adaptation?.safe_margins ?? "",
      scroll_stop_elements: data.platform_adaptation?.scroll_stop_elements ?? "",
    },
    image_generation_prompt: typeof data.image_generation_prompt === "string" ? data.image_generation_prompt : "",
    video_storyboard: Array.isArray(data.video_storyboard)
      ? data.video_storyboard.map((b) => ({
          scene: b?.scene ?? "",
          duration: b?.duration ?? "",
          visual: b?.visual ?? "",
          motion: b?.motion ?? "",
          copy: b?.copy ?? "",
        }))
      : [],
  };
}
