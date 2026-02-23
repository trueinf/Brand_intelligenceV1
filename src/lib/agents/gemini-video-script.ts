/**
 * Gemini-based 10–20s campaign video script agent.
 * Input: user input + dashboard data (brand_overview, campaigns, insights).
 * Output: VideoScript with title, 2–4 scenes, each scene narration ≤15 words, visual_hint.
 */

import { GoogleGenAI } from "@google/genai";
import type { VideoScript, VideoScene } from "@/types/video";
import type { BrandIntelligence } from "@/types/platform";

const MODEL = "gemini-2.0-flash";
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES_429: number = 1;

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return key;
}

function serializeDashboard(data: CampaignVideoScriptInput["dashboardData"]): string {
  if (!data) return "";
  const parts: string[] = [];
  if (data.brandOverview) {
    parts.push(
      `Brand: ${data.brandOverview.name}, ${data.brandOverview.domain}. ${data.brandOverview.summary}.`
    );
  }
  if (data.campaigns?.length) {
    parts.push(
      "Campaigns: " +
        data.campaigns
          .map(
            (c) =>
              `${c.campaign_name} (${c.campaign_type}): ${c.objective}, keyword ${c.main_keyword}`
          )
          .join("; ")
    );
  }
  if (data.insights) {
    parts.push(
      `Insights: ${data.insights.strategic_summary}. Market: ${data.insights.market_position}.`
    );
  }
  return parts.join("\n");
}

export interface CampaignVideoScriptInput {
  userInput: string;
  dashboardData?: {
    brandOverview?: BrandIntelligence["brandOverview"];
    campaigns?: BrandIntelligence["campaigns"];
    insights?: BrandIntelligence["insights"];
  } | null;
}

export type VideoScriptResult = { script: VideoScript } | { error: string; is429?: boolean };

const SYSTEM_PROMPT = `You are a video creative director. Create a short campaign video script for 10–20 seconds total.
Output valid JSON only, with this exact shape:
{
  "title": "string (short title)",
  "scenes": [
    {
      "heading": "string (scene title)",
      "text": "string (narration, at most 15 words)",
      "visual_hint": "string (brief visual description for the scene)"
    }
  ]
}
Rules: Exactly 2–4 scenes. Each "text" must be at most 15 words. Total runtime 10–20 seconds. No markdown, no code fences.`;

/**
 * Generate 10–20s campaign video script. Returns { script } or { error, is429 }. Never throws.
 */
export async function generateCampaignVideoScript(
  input: CampaignVideoScriptInput
): Promise<VideoScriptResult> {
  try {
    const apiKey = getGeminiKey();
    const ai = new GoogleGenAI({ apiKey });
    const context = serializeDashboard(input.dashboardData ?? null);
    const userPrompt = context
      ? `Context:\n${context}\n\nUser request: ${input.userInput}`
      : `User request: ${input.userInput}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const raw =
      (response as { text?: string }).text ??
      (response as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw?.trim()) return { error: "Gemini returned no video script" };

    const parsed = JSON.parse(raw) as { title?: string; scenes?: unknown[] };
    const title = typeof parsed.title === "string" ? parsed.title : "Campaign Video";
    const scenes = Array.isArray(parsed.scenes)
      ? parsed.scenes
          .filter(
            (s): s is VideoScene =>
              typeof s === "object" &&
              s !== null &&
              typeof (s as VideoScene).heading === "string" &&
              typeof (s as VideoScene).text === "string" &&
              typeof (s as VideoScene).visual_hint === "string"
          )
          .slice(0, 4)
      : [];
    if (scenes.length < 2) return { error: "Video script must have 2–4 scenes" };

    return { script: { title, scenes } };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : "Video script failed");
    const is429 =
      err?.status === 429 ||
      String(message).toLowerCase().includes("429") ||
      String(message).toLowerCase().includes("rate limit");
    return { error: message, is429 };
  }
}

export async function generateCampaignVideoScriptWithRetry(
  input: CampaignVideoScriptInput
): Promise<VideoScriptResult> {
  const first = await generateCampaignVideoScript(input);
  if (!("error" in first) || !first.is429 || MAX_RETRIES_429 === 0) return first;
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  const second = await generateCampaignVideoScript(input);
  if ("error" in second) {
    return { error: "Rate limit hit. Please try again in a few minutes." };
  }
  return second;
}
