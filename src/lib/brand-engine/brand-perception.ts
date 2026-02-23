/**
 * Brand perception engine.
 * Returns brand personality, position, strength score, emotional triggers.
 */

import type { BrandPerception } from "@/types/platform";
import { getOpenAIClient } from "@/lib/openai";

const MODEL = "gpt-4o";

export interface BrandPerceptionInput {
  brandName: string;
  domain: string;
  industry?: string;
  summary?: string;
  campaignSummary?: string;
}

/** Mock fallback when API is unavailable. */
export function getMockBrandPerception(brandName: string): BrandPerception {
  return {
    brandPersonality: ["Innovative", "Professional", "Trustworthy", "Forward-thinking"],
    brandPosition: "Challenger in the enterprise segment",
    brandStrengthScore: 72,
    emotionalTriggers: ["Reliability", "Innovation", "Growth", "Simplicity"],
  };
}

export async function runBrandPerception(
  input: BrandPerceptionInput,
  useMock = false
): Promise<BrandPerception> {
  if (useMock) return getMockBrandPerception(input.brandName);

  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a brand strategist. Return only valid JSON with: brandPersonality (string[]), brandPosition (string), brandStrengthScore (number 0-100), emotionalTriggers (string[]).`,
      },
      {
        role: "user",
        content: `Brand: ${input.brandName}, domain: ${input.domain}. ${input.industry ? `Industry: ${input.industry}.` : ""} ${input.summary ? `Summary: ${input.summary}.` : ""} ${input.campaignSummary ? `Campaign context: ${input.campaignSummary}.` : ""} Analyze brand perception.`,
      },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) return getMockBrandPerception(input.brandName);
  try {
    return JSON.parse(raw) as BrandPerception;
  } catch {
    return getMockBrandPerception(input.brandName);
  }
}
