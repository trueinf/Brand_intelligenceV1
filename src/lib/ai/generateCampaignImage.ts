/**
 * Shared campaign image generator service.
 * Single entry point for all campaign visuals; uses gpt-image-1, platform-aware, creative-direction-driven.
 * Uses getPosterSize for supported sizes only (1024x1024, 1024x1536, 1536x1024, auto).
 */

import { getOpenAIClient } from "@/lib/openai";
import { getPosterSize, normalizePosterSize } from "@/lib/getPosterSize";

export type CampaignImagePlatform =
  | "instagram"
  | "linkedin"
  | "story"
  | "website"
  | "print";

export type CampaignImageVisualType = "hero" | "lifestyle" | "product" | "banner";

/** Minimal creative direction shape (Creative Brain–compatible) for prompt building. */
export type CreativeDirectionForImage = {
  creative_strategy?: {
    objective?: string;
    core_emotion?: string;
    product_role?: string;
  };
  scene_direction?: {
    environment?: string;
    composition?: string;
    lighting?: string;
  };
  subject_direction?: {
    characters?: string;
  };
  brand_integration?: {
    packaging_visibility?: string;
  };
  copy_layout?: {
    headline_zone?: string;
  };
};

const STYLE_SUFFIX = `
Style:
high-end advertising photography
ultra realistic
shallow depth of field
sharp focus
professional lighting
premium color grading
`;

function buildPromptFromCreativeDirection(creativeDirection: CreativeDirectionForImage): string {
  const cs = creativeDirection.creative_strategy ?? {};
  const sd = creativeDirection.scene_direction ?? {};
  const sub = creativeDirection.subject_direction ?? {};
  const bi = creativeDirection.brand_integration ?? {};
  const cl = creativeDirection.copy_layout ?? {};
  const parts = [
    cs.objective ?? "",
    "Scene:",
    sd.environment ?? "",
    "Composition:",
    sd.composition ?? "",
    "Subject:",
    sub.characters ?? "",
    "Lighting:",
    sd.lighting ?? "",
    "Emotion:",
    cs.core_emotion ?? "",
    "Brand integration:",
    bi.packaging_visibility ?? "",
    cl.headline_zone
      ? `Copy space: Leave clean negative space for headline in ${cl.headline_zone}`
      : "Copy space: Leave clean negative space for headline",
    STYLE_SUFFIX,
  ];
  return parts.filter(Boolean).join("\n\n").trim().slice(0, 4000);
}

/** Simplified prompt for retry (shorter, fewer elements). */
function buildSimplifiedPrompt(creativeDirection: CreativeDirectionForImage): string {
  const cs = creativeDirection.creative_strategy ?? {};
  const sd = creativeDirection.scene_direction ?? {};
  return [
    cs.objective ?? "Premium campaign visual",
    sd.environment ?? "",
    sd.lighting ?? "",
    cs.core_emotion ?? "",
    STYLE_SUFFIX,
  ]
    .filter(Boolean)
    .join(". ")
    .trim()
    .slice(0, 2000);
}

const cache = new Map<string, { imageBase64: string; platform: string; visualType?: string }>();

function cacheKey(campaignId: string | undefined, platform: string, visualType?: string): string | null {
  if (!campaignId) return null;
  return [campaignId, platform, visualType ?? ""].join(":");
}

export type GenerateCampaignImageParams = {
  creativeDirection: CreativeDirectionForImage;
  platform: CampaignImagePlatform;
  visualType?: CampaignImageVisualType;
  campaignId?: string;
};

export type GenerateCampaignImageResult = {
  imageBase64: string;
  platform: CampaignImagePlatform;
  visualType?: CampaignImageVisualType;
  creativeDirection: CreativeDirectionForImage;
};

export async function generateCampaignImage({
  creativeDirection,
  platform,
  visualType,
  campaignId,
}: GenerateCampaignImageParams): Promise<GenerateCampaignImageResult> {
  const key = cacheKey(campaignId, platform, visualType);
  if (key) {
    const cached = cache.get(key);
    if (cached?.imageBase64) {
      return {
        imageBase64: cached.imageBase64,
        platform: platform as CampaignImagePlatform,
        visualType,
        creativeDirection,
      };
    }
  }

  const openai = getOpenAIClient();
  let prompt = buildPromptFromCreativeDirection(creativeDirection);

  let size = getPosterSize(platform);
  size = normalizePosterSize(size);

  try {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      size,
      prompt,
      n: 1,
    });

    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error("No image data returned from image generation");
    }

    if (key) {
      cache.set(key, { imageBase64, platform, visualType });
    }

    return {
      imageBase64,
      platform,
      visualType,
      creativeDirection,
    };
  } catch (firstError) {
    const simplifiedPrompt = buildSimplifiedPrompt(creativeDirection);
    try {
      const result = await openai.images.generate({
        model: "gpt-image-1",
        size,
        prompt: simplifiedPrompt,
        n: 1,
      });

      const imageBase64 = result.data?.[0]?.b64_json;
      if (!imageBase64) {
        throw new Error("No image data returned from retry");
      }

      if (key) {
        cache.set(key, { imageBase64, platform, visualType });
      }

      return {
        imageBase64,
        platform,
        visualType,
        creativeDirection,
      };
    } catch {
      throw firstError;
    }
  }
}

