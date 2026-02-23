/**
 * Video script agent: OpenAI generates InVideo-ready script from dashboard intelligence.
 * Output: { title, scenes: [{ text, visual_hint }] }
 */

import type { AnalyzeBrandResponse, InVideoScript } from "@/types";
import { callClaudeJson } from "@/lib/claude/client";

const SYSTEM_PROMPT = `You are a senior video director creating a business presentation script for InVideo AI.

Output ONLY valid JSON. No markdown, no code fences.

Schema:
{
  "title": "string (short video title)",
  "scenes": [
    {
      "text": "string (narration or on-screen text for this scene, 1-2 sentences)",
      "visual_hint": "string (brief visual direction: e.g. 'dashboard chart', 'team meeting', 'data graphics')"
    }
  ]
}

Generate 5–7 scenes for a business presentation style video:
1. Brand intro
2. Growth or traffic trend
3. Channel mix (organic, paid, social)
4. Top campaigns highlight
5. Market position
6. Strategic recommendation
(Optional 7th: closing CTA)

Keep text concise and professional. Visual hints should be short (2–5 words) for InVideo to match assets.`;

export function buildVideoScriptUserPrompt(dashboardData: AnalyzeBrandResponse): string {
  return `Generate the video script JSON for this brand intelligence dashboard:

Brand: ${dashboardData.brand_overview.name}
Domain: ${dashboardData.brand_overview.domain}
Summary: ${dashboardData.brand_overview.summary}

Campaigns (${dashboardData.campaigns.length}): ${JSON.stringify(
    dashboardData.campaigns.slice(0, 5).map((c) => ({
      name: c.campaign_name,
      type: c.campaign_type,
      traffic_share: c.traffic_share,
    }))
  )}

Insights: growth_score ${dashboardData.insights.growth_score}, market_position ${dashboardData.insights.market_position}.
Strategic summary: ${dashboardData.insights.strategic_summary.slice(0, 300)}

Return the strict JSON with title and scenes array only.`;
}

export async function generateVideoScript(
  dashboardData: AnalyzeBrandResponse
): Promise<InVideoScript> {
  const raw = await callClaudeJson<InVideoScript>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildVideoScriptUserPrompt(dashboardData),
  });
  if (!raw.title || !Array.isArray(raw.scenes) || raw.scenes.length === 0) {
    throw new Error("Invalid video script: missing title or scenes");
  }
  return {
    title: String(raw.title),
    scenes: raw.scenes.map((s) => ({
      text: String(s?.text ?? "").slice(0, 500),
      visual_hint: String(s?.visual_hint ?? "").slice(0, 200),
    })),
  };
}
