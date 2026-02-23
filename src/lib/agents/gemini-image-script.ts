/**
 * Gemini-based image script agent.
 * Input: CampaignCreativeInput + optional brand rules → single DALL·E-style image prompt.
 * Used when IMAGE_AGENT=gemini. Handles 429/401/500 with clear errors; optional retry on 429.
 */

import { GoogleGenAI } from "@google/genai";
import type { CampaignCreativeInput } from "@/types/platform";

const MODEL = "gemini-2.0-flash";
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES_429: number = 1;

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return key;
}

function buildUserPrompt(input: CampaignCreativeInput, brandRules: string): string {
  const parts = [
    `Brand: ${input.brandName}.`,
    `Goal: ${input.campaignGoal}.`,
    `Channel: ${input.channel}.`,
    input.audience ? `Audience: ${input.audience}.` : "",
    input.tone ? `Tone: ${input.tone}.` : "",
    input.keyMessage ? `Key message: ${input.keyMessage}.` : "",
    input.visualStyle ? `Visual style: ${input.visualStyle}.` : "",
    `Brand rules: ${brandRules}`,
  ];
  return parts.filter(Boolean).join(" ");
}

export type ImageScriptResult = { prompt: string } | { error: string; is429?: boolean };

/**
 * Generate a single detailed image prompt from campaign input and brand rules.
 * Returns { prompt } or { error, is429 }. Never throws.
 */
export async function generateImageScript(
  input: CampaignCreativeInput,
  brandRules: string
): Promise<ImageScriptResult> {
  try {
    const apiKey = getGeminiKey();
    const ai = new GoogleGenAI({ apiKey });
    const userPrompt = buildUserPrompt(input, brandRules);
    const systemPrompt =
      "You are a creative director. Given brand and campaign inputs, output a single DALL·E style image prompt (1-2 sentences, no code). Include: campaign goal, audience, tone, key message. No markdown. Output only the prompt text.";

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
      config: { temperature: 0.7 },
    });

    const text =
      (response as { text?: string }).text ??
      (response as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates?.[0]?.content?.parts?.[0]?.text;
    const prompt = text?.trim();
    if (!prompt) return { error: "Gemini returned no image prompt" };
    return { prompt };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : "Image script failed");
    const is429 = err?.status === 429 || String(message).toLowerCase().includes("429") || String(message).toLowerCase().includes("rate limit");
    return { error: message, is429 };
  }
}

/**
 * Generate image script with optional single retry on 429.
 */
export async function generateImageScriptWithRetry(
  input: CampaignCreativeInput,
  brandRules: string
): Promise<ImageScriptResult> {
  const first = await generateImageScript(input, brandRules);
  if (!("error" in first) || !first.is429 || MAX_RETRIES_429 === 0) return first;
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  const second = await generateImageScript(input, brandRules);
  if ("error" in second) {
    return { error: "Rate limit hit. Please try again in a few minutes." };
  }
  return second;
}
