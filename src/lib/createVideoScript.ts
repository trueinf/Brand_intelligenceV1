/**
 * Generate a 60–90 second executive strategy video script from dashboard data.
 * Uses OpenAI gpt-4o. Output is modular for Remotion or InVideo.
 */

import { getOpenAIClient } from "@/lib/openai";
import type { VideoScript, VideoScene } from "@/types/video";
import type { AnalyzeBrandResponse } from "@/types";

const MODEL = "gpt-4o";

const SYSTEM_PROMPT = `You are a senior strategy consultant. Create a 60–90 second executive strategy video script from brand intelligence data.

Output ONLY valid JSON. No markdown, no code fences.

Strict schema:
{
  "title": "string (short video title, e.g. 'Brand X Strategy Overview')",
  "scenes": [
    {
      "heading": "string (scene title, 2–5 words)",
      "text": "string (narration for this scene, under 40 words)",
      "visual_hint": "string (brief visual direction for Remotion/InVideo, 2–8 words)"
    }
  ]
}

Rules:
- Maximum 7 scenes.
- Each scene "text" must be under 40 words.
- Use real data from the dashboard (brand name, metrics, campaign names, insights).
- Professional consulting tone.
- Scenes: brand intro, growth/traffic, channel mix, top campaigns, market position, strategic recommendation, optional closing.`;

function buildUserPrompt(data: AnalyzeBrandResponse): string {
  return `Generate the video script JSON for this brand intelligence dashboard:

Brand: ${data.brand_overview.name}
Domain: ${data.brand_overview.domain}
Summary: ${data.brand_overview.summary}

Campaigns: ${JSON.stringify(
    data.campaigns.slice(0, 5).map((c) => ({
      name: c.campaign_name,
      type: c.campaign_type,
      traffic_share: c.traffic_share,
      success_score: c.success_score,
    }))
  )}

Insights: growth_score ${data.insights.growth_score}, market_position ${data.insights.market_position}, top_country ${data.insights.top_country}.
Strategic summary: ${data.insights.strategic_summary.slice(0, 400)}
${data.insights.channel_strategy_summary ? `Channel strategy: ${data.insights.channel_strategy_summary.slice(0, 200)}` : ""}

${data.synthetic_data?.channel_mix ? `Channel mix: ${JSON.stringify(data.synthetic_data.channel_mix)}` : ""}

Return only the JSON object with title and scenes.`;
}

export async function createVideoScript(
  dashboardData: AnalyzeBrandResponse
): Promise<VideoScript> {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(dashboardData) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned no content for video script");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI did not return valid JSON for video script");
  }

  const obj = parsed as { title?: string; scenes?: unknown[] };
  if (!obj.title || !Array.isArray(obj.scenes) || obj.scenes.length === 0) {
    throw new Error("Video script missing title or scenes");
  }

  const scenes: VideoScene[] = obj.scenes.slice(0, 7).map((s: unknown, i) => {
    const scene = s as Record<string, unknown>;
    const heading = String(scene.heading ?? scene.title ?? `Scene ${i + 1}`).slice(0, 100);
    const text = String(scene.text ?? "").slice(0, 400);
    const visual_hint = String(scene.visual_hint ?? "").slice(0, 150);
    if (!text.trim()) throw new Error(`Scene ${i + 1} has no text`);
    return { heading, text, visual_hint };
  });

  return { title: String(obj.title).slice(0, 200), scenes };
}
