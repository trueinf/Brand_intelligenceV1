/**
 * Campaign Information Composer — generates structured CampaignInfoOutput from input.
 */

import { getOpenAIClient } from "@/lib/openai";
import type { CampaignInfoInput, CampaignInfoOutput } from "./campaign-info.types";
import { buildCampaignInfoPrompt, CAMPAIGN_INFO_SYSTEM } from "./campaign-info.prompt";

const MODEL = "gpt-4o";
const TEMPERATURE = 0.7;

export async function generateCampaignInformation(
  input: CampaignInfoInput
): Promise<CampaignInfoOutput> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: TEMPERATURE,
    messages: [
      { role: "system", content: CAMPAIGN_INFO_SYSTEM },
      { role: "user", content: buildCampaignInfoPrompt(input) },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from campaign info composer");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const fallbackCta =
    typeof input.valueProposition === "string"
      ? input.valueProposition.slice(0, 20)
      : "Learn more";
  return {
    kicker: typeof parsed.kicker === "string" ? parsed.kicker : undefined,
    headline: typeof parsed.headline === "string" ? parsed.headline : "Campaign",
    subHeadline: typeof parsed.subHeadline === "string" ? parsed.subHeadline : undefined,
    productLine: typeof parsed.productLine === "string" ? parsed.productLine : undefined,
    experienceLine: typeof parsed.experienceLine === "string" ? parsed.experienceLine : undefined,
    eventDetails: typeof parsed.eventDetails === "string" ? parsed.eventDetails : undefined,
    availabilityLine:
      typeof parsed.availabilityLine === "string" ? parsed.availabilityLine : undefined,
    offerLine: typeof parsed.offerLine === "string" ? parsed.offerLine : undefined,
    cta: typeof parsed.cta === "string" ? parsed.cta : fallbackCta,
  };
}
