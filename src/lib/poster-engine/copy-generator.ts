/**
 * AI copy for campaign posters: headline, subline, CTA.
 * Platform-ready, emotional headline, benefit-driven subline, short CTA.
 */

import { getOpenAIClient } from "@/lib/openai";
import type { CampaignBrief } from "@/types/campaign";
import type { PosterCopy } from "@/types/poster";

const MODEL = "gpt-4o";

export async function generatePosterCopy(campaignBrief: CampaignBrief): Promise<PosterCopy> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a senior copywriter for global brand campaigns. Output only valid JSON.
Rules: emotional headline (short, punchy). Benefit-driven subline (one line). Optional offer if relevant. Short CTA (1–3 words). Platform-ready, no hashtags unless brand demands.`,
      },
      {
        role: "user",
        content: `Generate poster copy for this campaign. Return JSON only, no markdown:
${JSON.stringify(campaignBrief, null, 2)}

JSON shape:
{ "headline": "string", "subline": "string", "offer": "string or omit", "cta": "string" }`,
      },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from copy generator");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    headline: typeof parsed.headline === "string" ? parsed.headline : campaignBrief.keyMessage?.slice(0, 60) ?? "Discover more",
    subline: typeof parsed.subline === "string" ? parsed.subline : campaignBrief.valueProposition?.slice(0, 80) ?? "",
    offer: typeof parsed.offer === "string" ? parsed.offer : undefined,
    cta: typeof parsed.cta === "string" ? parsed.cta : campaignBrief.callToAction?.slice(0, 20) ?? "Learn more",
  };
}
