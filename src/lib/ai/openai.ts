/**
 * AI service layer — OpenAI (gpt-4.1 / gpt-4o) for brand intelligence.
 * Single place for model and prompt changes.
 */

import { getOpenAIClient } from "@/lib/openai";
import type { BrandIntelligence, KeywordIntelligence, StrategyInsights } from "@/types/platform";
import type { VideoScript } from "@/types/video";
import type { CampaignCreativeInput } from "@/types/platform";

const MODEL = "gpt-4o"; // use "gpt-4.1" when available

// ---------- Brand insights ----------

export async function generateBrandInsights(
  brandName: string,
  domain: string,
  industry?: string
): Promise<{ overview: BrandIntelligence["brandOverview"]; insights: StrategyInsights }> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a brand strategist. Return only valid JSON with keys: overview (name, domain, summary, industry), insights (growth_score, paid_vs_organic_strategy, market_position, top_competitors, top_country, strategic_summary, marketing_maturity_level).",
      },
      {
        role: "user",
        content: `Generate brand overview and strategy insights for: ${brandName}, domain ${domain}${industry ? `, industry ${industry}` : ""}.`,
      },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");
  return JSON.parse(raw) as { overview: BrandIntelligence["brandOverview"]; insights: StrategyInsights };
}

// ---------- Keyword clusters ----------

export async function generateKeywordClusters(
  websiteContentSnippet: string,
  campaignMessaging: string[]
): Promise<KeywordIntelligence> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are an SEO strategist. Return only valid JSON with: coreKeywords (string[]), intentClusters ({ intent, keywords, volume? }[]), contentOpportunities ({ topic, keywords, priority, rationale? }[]), keywordGaps ({ keyword, competitor?, opportunity }[]).`,
      },
      {
        role: "user",
        content: `Website snippet: ${websiteContentSnippet.slice(0, 2000)}\nCampaign messaging: ${campaignMessaging.join("; ")}\nGenerate keyword intelligence.`,
      },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");
  return JSON.parse(raw) as KeywordIntelligence;
}

// ---------- Strategy video script ----------

export async function generateStrategyScript(
  brandName: string,
  summary: string,
  campaignsSummary: string,
  insightsSummary: string
): Promise<VideoScript> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a strategy consultant. Return only valid JSON: { "title": "string", "scenes": [ { "heading": "string", "text": "string", "visual_hint": "string" } ] }. Max 7 scenes, each text under 40 words.`,
      },
      {
        role: "user",
        content: `Brand: ${brandName}. Summary: ${summary}. Campaigns: ${campaignsSummary}. Insights: ${insightsSummary}. Generate video script JSON.`,
      },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");
  return JSON.parse(raw) as VideoScript;
}

// ---------- Campaign creative prompt (for image generation) ----------

export async function generateCampaignCreativePrompt(
  input: CampaignCreativeInput,
  brandDesignRules?: string
): Promise<string> {
  const client = getOpenAIClient();
  const rules = brandDesignRules ?? "Professional, on-brand visuals; clear typography and modern layout.";
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a creative director. Given brand and campaign inputs, output a single DALL-E style image prompt (1-2 sentences, no code). Style: ${rules}. Include: campaign goal, audience, tone, key message. No markdown.`,
      },
      {
        role: "user",
        content: `Brand: ${input.brandName}. Goal: ${input.campaignGoal}. Channel: ${input.channel}. ${input.audience ? `Audience: ${input.audience}.` : ""} ${input.tone ? `Tone: ${input.tone}.` : ""} ${input.keyMessage ? `Key message: ${input.keyMessage}.` : ""} ${input.visualStyle ? `Visual style: ${input.visualStyle}.` : ""}`,
      },
    ],
  });
  const prompt = res.choices[0]?.message?.content?.trim();
  if (!prompt) throw new Error("Empty prompt from OpenAI");
  return prompt;
}
