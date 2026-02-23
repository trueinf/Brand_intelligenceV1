/**
 * Campaign Information Composer — prompt template.
 * AI acts as senior brand campaign strategist. Returns STRICT JSON.
 */

import type { CampaignInfoInput } from "./campaign-info.types";

const RULES_BY_OBJECTIVE = {
  event: `
- Elegant event name as headline or kicker.
- Location + date line in eventDetails (e.g. "March 15, 2026 • The Grand Ballroom").
- Reservation or RSVP CTA.
`,
  productLaunch: `
- "Introducing" or launch-style headline.
- Product benefit in subHeadline or productLine.
- availabilityLine (e.g. "Available now" / "Coming Spring 2026").
`,
  seasonalPromo: `
- Collection or seasonal name.
- Limited-time urgency in copy.
- offerLine with clear offer (e.g. "20% off this weekend").
`,
  retail: `
- Price or offer prominent in headline or offerLine.
- Store action CTA (e.g. "Shop in store" / "Order now").
`,
  brandAwareness: `
- Emotional experience line (experienceLine).
- No hard selling; brand story or feeling.
- Soft CTA (e.g. "Discover more" / "Join us").
`,
};

export function buildCampaignInfoPrompt(input: CampaignInfoInput): string {
  const rules = RULES_BY_OBJECTIVE[input.campaignObjective] ?? "";
  return `You are a senior brand campaign strategist. Generate a structured, marketing-ready information block for a poster or ad.

Brand: ${input.brandName}
Objective: ${input.campaignObjective}
${input.valueProposition ? `Value proposition: ${input.valueProposition}` : ""}
${input.targetAudience ? `Target audience: ${input.targetAudience}` : ""}
${input.brandTone ? `Brand tone: ${input.brandTone}` : ""}
${input.productName ? `Product: ${input.productName}` : ""}
${input.offer ? `Offer: ${input.offer}` : ""}
${input.location ? `Location: ${input.location}` : ""}
${input.date ? `Date: ${input.date}` : ""}
${input.time ? `Time: ${input.time}` : ""}

Rules for ${input.campaignObjective}:
${rules}

Return ONLY valid JSON (no markdown, no code fence) with this exact shape:
{
  "kicker": "string or omit",
  "headline": "string",
  "subHeadline": "string or omit",
  "productLine": "string or omit",
  "experienceLine": "string or omit",
  "eventDetails": "string or omit",
  "availabilityLine": "string or omit",
  "offerLine": "string or omit",
  "cta": "string"
}`;
}

export const CAMPAIGN_INFO_SYSTEM = `You are a senior brand campaign strategist. Output only valid JSON for the campaign information block. No markdown, no code fence.`;
