/**
 * Build master creative prompt for campaign image generation.
 * Combines brand design rules + AI-generated prompt.
 */

import type { CampaignCreativeInput } from "@/types/platform";
import { generateCampaignCreativePrompt } from "@/lib/ai/openai";

export interface BrandDesignRules {
  voice?: string;
  visualStyle?: string;
  colors?: string;
  doNot?: string[];
}

const DEFAULT_RULES: BrandDesignRules = {
  voice: "Professional and aspirational",
  visualStyle: "Clean, modern, high contrast",
  doNot: ["cluttered layouts", "low-res imagery"],
};

/** Load brand design rules (from DB or mock). */
export function loadBrandDesignRules(brandId?: string): BrandDesignRules {
  // TODO: load from Prisma Brand or brand_rules table when available
  return DEFAULT_RULES;
}

function rulesToText(rules: BrandDesignRules): string {
  const parts: string[] = [];
  if (rules.voice) parts.push(`Voice: ${rules.voice}.`);
  if (rules.visualStyle) parts.push(`Visual style: ${rules.visualStyle}.`);
  if (rules.colors) parts.push(`Colors: ${rules.colors}.`);
  if (rules.doNot?.length) parts.push(`Avoid: ${rules.doNot.join(", ")}.`);
  return parts.join(" ") || "Professional, on-brand visuals.";
}

/** Build final image prompt using AI. */
export async function buildCreativePrompt(
  input: CampaignCreativeInput,
  brandId?: string
): Promise<string> {
  const rules = loadBrandDesignRules(brandId);
  const rulesText = rulesToText(rules);
  return generateCampaignCreativePrompt(input, rulesText);
}
