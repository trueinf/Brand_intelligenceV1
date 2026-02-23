/**
 * Graph 3 — Campaign Image: campaign_form_input → brand_rule_loader → creative_prompt_builder
 * → image_generation_node → asset_storage_node.
 */

import { loadBrandDesignRules, buildCreativePrompt } from "@/lib/creative-engine/prompt-builder";
import { generateCampaignImage } from "@/lib/ai/generateCampaignImage";
import { storeAsset, storeAssetFromUrl } from "@/lib/storage/blob";
import type { CampaignImageState, CampaignImageUpdate } from "./campaign-image-state";

export function campaignFormInputNode(state: CampaignImageState): CampaignImageUpdate {
  return { error: null };
}

export function brandRuleLoaderNode(state: CampaignImageState): CampaignImageUpdate {
  const rules = loadBrandDesignRules(state.input.brandId);
  const text = [
    rules.voice && `Voice: ${rules.voice}`,
    rules.visualStyle && `Visual: ${rules.visualStyle}`,
    rules.colors && `Colors: ${rules.colors}`,
    rules.doNot?.length && `Avoid: ${rules.doNot.join(", ")}`,
  ]
    .filter(Boolean)
    .join(". ");
  return { brandRules: text || "Professional on-brand visuals.", error: null };
}

export async function creativePromptBuilderNode(
  state: CampaignImageState
): Promise<CampaignImageUpdate> {
  try {
    const masterPrompt = await buildCreativePrompt(state.input, state.input.brandId);
    return { masterPrompt, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Prompt build failed";
    return { error: message };
  }
}

export async function imageGenerationNode(
  state: CampaignImageState
): Promise<CampaignImageUpdate> {
  if (!state.masterPrompt) return { error: state.error ?? "Master prompt missing" };
  try {
    const creativeDirection = {
      creative_strategy: { objective: state.masterPrompt.slice(0, 500), core_emotion: "professional" },
      scene_direction: { environment: state.masterPrompt, composition: "center", lighting: "professional" },
      subject_direction: { characters: "" },
      brand_integration: { packaging_visibility: "" },
      copy_layout: { headline_zone: "top" },
    };
    const result = await generateCampaignImage({
      creativeDirection,
      platform: "linkedin",
      visualType: "hero",
    });
    const buffer = Buffer.from(result.imageBase64, "base64");
    const storedUrl = await storeAsset("image", buffer, { prefix: "campaign", extension: "png" });
    return { imageUrl: storedUrl, storedUrl, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    return { error: message };
  }
}

export async function assetStorageNode(state: CampaignImageState): Promise<CampaignImageUpdate> {
  if (state.storedUrl) return { error: null };
  if (!state.imageUrl) return { error: state.error ?? "No image to store" };
  try {
    const storedUrl = await storeAssetFromUrl("image", state.imageUrl, {
      prefix: "campaign",
      extension: "png",
    });
    return { storedUrl, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Asset storage failed";
    return { error: message };
  }
}
