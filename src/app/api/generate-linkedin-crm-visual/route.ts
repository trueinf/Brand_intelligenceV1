/**
 * POST /api/generate-linkedin-crm-visual
 * Generates the high-end LinkedIn CRM campaign image and returns the stored URL.
 * Uses shared campaign image service; image is saved to public/creatives.
 */

import { NextResponse } from "next/server";
import { generateCampaignImage } from "@/lib/ai/generateCampaignImage";
import { storeAsset } from "@/lib/storage/blob";
import { LINKEDIN_CRM_CAMPAIGN_PROMPT } from "@/lib/creative-engine/linkedin-crm-campaign-prompt";

const LINKEDIN_CRM_CREATIVE_DIRECTION = {
  creative_strategy: {
    objective: "Premium B2B SaaS, sales leaders, CRM platform",
    core_emotion: "intelligent, premium, confident",
    product_role: "supporting",
  },
  scene_direction: {
    environment: LINKEDIN_CRM_CAMPAIGN_PROMPT,
    composition: "people form triangle with screen; negative space top-left and bottom-right",
    lighting: "cool blue fill, warm edge light",
  },
  subject_direction: { characters: "diverse executive sales team, tailored business attire" },
  brand_integration: { packaging_visibility: "premium SaaS UI on screen" },
  copy_layout: { headline_zone: "top-left" },
};

export async function POST() {
  try {
    const result = await generateCampaignImage({
      creativeDirection: LINKEDIN_CRM_CREATIVE_DIRECTION,
      platform: "linkedin",
      visualType: "banner",
    });
    const buffer = Buffer.from(result.imageBase64, "base64");
    const storedUrl = await storeAsset("image", buffer, {
      prefix: "linkedin-crm-campaign",
      extension: "png",
    });
    return NextResponse.json({
      url: storedUrl,
      headline: "Where sales leaders see what's next.",
      cta: "See the platform",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
