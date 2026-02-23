/**
 * Synthetic Data Agent: senior marketing intelligence engine.
 * Generates realistic multi-channel dataset (SEMrush/Similarweb/Trends-style) from company context.
 */

import type { BrandContext, SyntheticData } from "@/types";

const SYSTEM_PROMPT = `You are a senior marketing intelligence engine.

Your task is to generate a realistic multi-channel marketing dataset
for the given company.

The dataset must look like it came from tools such as SEMrush, Similarweb, and Google Trends.

Use the company context to shape the strategy.

--------------------------------
REQUIREMENTS
--------------------------------

Make the strategy realistic for the industry and size.

A SaaS company → organic & content heavy.
An e-commerce brand → paid + product campaigns.
A local business → geo-focused and branded search.

Traffic numbers must be believable.

--------------------------------
RETURN STRICT JSON
--------------------------------

{
  "domain_overview": {
    "authority_score": number,
    "organic_traffic": number,
    "paid_traffic": number,
    "backlink_count": number,
    "top_country": string
  },

  "channel_mix": {
    "organic": percentage,
    "paid": percentage,
    "social": percentage,
    "direct": percentage
  },

  "traffic_trend": [
    { "month": "Jan", "traffic": number }
  ],

  "paid_keywords": [
    {
      "keyword": "",
      "cpc": number,
      "traffic_share": percentage,
      "intent": "transactional | branded | competitor"
    }
  ],

  "organic_keywords": [
    {
      "keyword": "",
      "position": number,
      "traffic_share": percentage
    }
  ],

  "competitors": [
    {
      "domain": "",
      "traffic": number,
      "overlap": percentage
    }
  ],

  "campaign_timeline": [
    {
      "campaign_name": "",
      "channel": "paid | organic | social",
      "goal": "",
      "duration": "",
      "impact_level": "low | medium | high"
    }
  ]
}

Output ONLY valid JSON. No markdown, no code fences, no explanation.
channel_mix percentages must sum to 100.
Generate 6-12 months for traffic_trend, 5-12 paid_keywords, 5-12 organic_keywords, 3-6 competitors, 3-6 campaign_timeline events.`;

export const SYNTHETIC_DATA_SYSTEM_PROMPT = SYSTEM_PROMPT;

export function buildSyntheticDataUserPrompt(
  brandName: string,
  domain: string,
  brandContext: BrandContext | null
): string {
  const company_name = brandContext?.name ?? brandName;
  const industry = brandContext?.industry ?? "unknown";
  const employee_range = brandContext?.employeesRange ?? String(brandContext?.employees ?? "unknown");
  const country = brandContext?.country ?? brandContext?.location ?? "unknown";

  return `--------------------------------
COMPANY CONTEXT
--------------------------------

Company name: ${company_name}
Industry: ${industry}
Company size: ${employee_range}
Country: ${country}

Domain: ${domain}

Generate the strict JSON dataset as specified.`;
}
