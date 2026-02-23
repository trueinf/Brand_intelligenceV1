/**
 * Video Story Agent: OpenAI generates 5–7 cinematic scenes from dashboard intelligence.
 */

import type { AnalyzeBrandResponse, VideoStory } from "@/types";

export const VIDEO_STORY_SYSTEM_PROMPT = `You are a senior video director creating a cinematic marketing intelligence video script.

Output ONLY valid JSON. No markdown, no code fences.

Schema:
{
  "scenes": [
    {
      "title": "string",
      "narration": "string (concise, professional, 1-2 sentences)",
      "visual_description": "string (high-quality scene description for AI image generation: style, composition, mood)",
      "duration": 4
    }
  ]
}

Generate exactly 6 scenes in this order:
1. Brand intro – logo + title animation, introduce the brand and domain
2. Growth chart – animated line chart visual, traffic or growth narrative
3. Channel mix – animated donut chart, organic/paid/social/direct
4. Campaign highlights – floating campaign cards, key campaigns
5. Market position – text reveal with background motion, leader/challenger/niche
6. Strategic recommendation – cinematic closing frame, summary and next steps

Narration: concise, professional, suitable for voiceover.
Visual descriptions: high-quality 16:9 scene for image generation (e.g. "Modern marketing dashboard with animated charts, dark theme, cinematic lighting, 16:9 widescreen"). Duration in seconds, 4–10 per scene; total video 60–90 seconds.`;

export function buildVideoStoryUserPrompt(dashboardData: AnalyzeBrandResponse): string {
  return `Generate the video story JSON for this brand intelligence dashboard:

Brand: ${dashboardData.brand_overview.name}
Domain: ${dashboardData.brand_overview.domain}
Summary: ${dashboardData.brand_overview.summary}

Campaigns (${dashboardData.campaigns.length}): ${JSON.stringify(
    dashboardData.campaigns.slice(0, 5).map((c) => ({
      name: c.campaign_name,
      type: c.campaign_type,
      traffic_share: c.traffic_share,
      success_score: c.success_score,
    }))
  )}

Insights: growth_score ${dashboardData.insights.growth_score}, market_position ${dashboardData.insights.market_position}, top_country ${dashboardData.insights.top_country}.
Strategic summary: ${dashboardData.insights.strategic_summary.slice(0, 300)}
${dashboardData.insights.channel_strategy_summary ? `Channel strategy: ${dashboardData.insights.channel_strategy_summary.slice(0, 200)}` : ""}

${dashboardData.synthetic_data?.channel_mix ? `Channel mix: ${JSON.stringify(dashboardData.synthetic_data.channel_mix)}` : ""}
${dashboardData.traffic_trend?.length ? `Traffic trend (recent): ${JSON.stringify(dashboardData.traffic_trend.slice(-3))}` : ""}

Return the strict JSON with scenes array only.`;
}
