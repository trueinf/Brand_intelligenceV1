/**
 * POST /api/generate-rooftop-wine-visual
 * Generates the luxury rooftop sunset wine tasting campaign image.
 * Saves to public/creatives, returns url + suggested copy.
 */

import { NextResponse } from "next/server";
import { generateCampaignImage } from "@/lib/ai/generateCampaignImage";
import { storeAsset } from "@/lib/storage/blob";
import {
  ROOFTOP_WINE_CAMPAIGN_PROMPT,
  ROOFTOP_WINE_EVENT_TITLE,
  ROOFTOP_WINE_DATE_CTA,
} from "@/lib/creative-engine/rooftop-wine-campaign-prompt";

const ROOFTOP_CREATIVE_DIRECTION = {
  creative_strategy: {
    objective: "Luxury rooftop wine tasting, celebration, exclusivity",
    core_emotion: "celebration, exclusivity, belonging",
    product_role: "hero",
  },
  scene_direction: {
    environment: ROOFTOP_WINE_CAMPAIGN_PROMPT,
    composition: "bottle dominant lower third; people and skyline behind; negative space top and bottom",
    lighting: "golden hour, warm rim light",
  },
  subject_direction: { characters: "affluent young professionals, wine tasting moment" },
  brand_integration: { packaging_visibility: "wine bottle as hero" },
  copy_layout: { headline_zone: "top" },
};

export async function POST() {
  try {
    const result = await generateCampaignImage({
      creativeDirection: ROOFTOP_CREATIVE_DIRECTION,
      platform: "story",
    });
    const buffer = Buffer.from(result.imageBase64, "base64");
    const storedUrl = await storeAsset("image", buffer, {
      prefix: "rooftop-wine-campaign",
      extension: "png",
    });
    return NextResponse.json({
      url: storedUrl,
      eventTitle: ROOFTOP_WINE_EVENT_TITLE,
      dateCta: ROOFTOP_WINE_DATE_CTA,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
