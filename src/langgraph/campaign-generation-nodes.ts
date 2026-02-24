/**
 * Campaign generation graph nodes.
 */

import { getOpenAIClient } from "@/lib/openai";
import { generateCampaignImage } from "@/lib/ai/generateCampaignImage";
import { storeAsset } from "@/lib/storage/blob";
import {
  generateVideoFromPrompt,
  buildAdVideoPromptFromScript,
} from "@/lib/xai-video";
import { getBrandKit } from "@/lib/brand-kit/load-brand-kit";
import type {
  CampaignBrief,
  CampaignCreativePrompts,
  VideoScene,
  VideoSceneSpec,
  GeneratedAdImage,
} from "@/types/campaign";
import type { CampaignGenerationState, CampaignGenerationUpdate } from "./campaign-generation-state";

const MODEL = "gpt-4o";

function buildStrategistPrompt(input: CampaignGenerationState["input"]): string {
  const { brandName, brandOverview, keywordIntelligence, strategyInsights, campaignsSummary } = input ?? {};
  return `Generate a campaign brief for the following brand intelligence.

Brand: ${brandName}
${brandOverview?.summary ? `Summary: ${brandOverview.summary}` : ""}
${strategyInsights?.strategic_summary ? `Strategy: ${strategyInsights.strategic_summary}` : ""}
${strategyInsights?.market_position ? `Market position: ${strategyInsights.market_position}` : ""}
${strategyInsights?.growth_score != null ? `Growth score: ${strategyInsights.growth_score}` : ""}
${keywordIntelligence?.coreKeywords?.length ? `Core keywords: ${keywordIntelligence.coreKeywords.join(", ")}` : ""}
${campaignsSummary ? `Campaigns context: ${campaignsSummary}` : ""}

Return ONLY valid JSON with this exact structure (no markdown, no code fence):
{
  "objective": "string",
  "targetAudience": "string",
  "funnelStage": "string",
  "keyMessage": "string",
  "valueProposition": "string",
  "emotionalHook": "string",
  "primaryChannel": "string",
  "visualStyle": "string",
  "callToAction": "string",
  "campaignConcept": "string"
}`;
}

export async function campaignStrategistNode(
  state: CampaignGenerationState
): Promise<CampaignGenerationUpdate> {
  const input = state.input;
  if (!input?.brandName) {
    return { error: "Missing campaign generation input" };
  }
  try {
    const client = getOpenAIClient();
    const res = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a senior campaign strategist. Output only valid JSON for the campaign brief. No markdown.",
        },
        { role: "user", content: buildStrategistPrompt(input) },
      ],
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return { error: "Empty response from campaign strategist" };
    const brief = JSON.parse(raw) as CampaignBrief;
    return { campaignBrief: brief, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign strategist failed";
    return { error: message };
  }
}

const SCENE_IDS = ["hook", "problem", "value", "proof", "cta"] as const;

const CREATIVE_DIRECTOR_SYSTEM = `You are a world-class advertising creative director. Your task is to convert a structured Campaign Brief into:
1) A HIGH-END COMMERCIAL IMAGE GENERATION PROMPT
2) A CINEMATIC VIDEO AD SCENE PLAN

The output must look like a real global brand campaign (Nike, Apple, Dior level), not generic AI art.

STYLE RULES: The output must feel like a real paid advertising campaign shot by a professional production team. NOT generic AI generated imagery, not fantasy, not illustration unless explicitly required by the brand.

TONE: Confident. Premium. Visually descriptive. Concise. Production-ready.

Output ONLY valid JSON. No markdown, no code fence.`;

function buildPromptBuilderPrompt(brief: CampaignBrief): string {
  const campaignBriefBlock = JSON.stringify(brief, null, 2);
  return `--------------------------------
INPUT
--------------------------------

Campaign Brief:
${campaignBriefBlock}

--------------------------------
GOAL
--------------------------------

Create ad creatives that:
- match the brand positioning
- attract the defined target audience
- communicate the core value proposition
- reflect the campaign objective
- are platform-ready for paid media

--------------------------------
OUTPUT FORMAT (STRICT JSON)
--------------------------------

{
  "imagePrompt": "",
  "videoScenes": [
    { "scene": "Hook", "description": "", "visualDirection": "", "camera": "", "lighting": "", "emotion": "" },
    { "scene": "Problem / Desire", "description": "", "visualDirection": "", "camera": "", "lighting": "", "emotion": "" },
    { "scene": "Value Proposition", "description": "", "visualDirection": "", "camera": "", "lighting": "", "emotion": "" },
    { "scene": "Social Proof / Emotional Payoff", "description": "", "visualDirection": "", "camera": "", "lighting": "", "emotion": "" },
    { "scene": "Call To Action", "description": "", "visualDirection": "", "camera": "", "lighting": "", "emotion": "" }
  ]
}

--------------------------------
INSTRUCTIONS — IMAGE PROMPT
--------------------------------

Build the image prompt using these layers:
1) Brand DNA — Use brand personality, category, and price positioning to define the visual identity.
2) Campaign Strategy — Reflect the campaign objective and funnel stage.
3) Target Audience — The people, styling, environment, and lifestyle must match the audience.
4) Scene Construction — Define: hero product, human moment, environment, composition.
5) Art Direction — Always include: professional commercial photography, cinematic lighting, shallow depth of field, high dynamic range, editorial magazine quality, ultra realistic textures.
6) Platform Layout — Ensure the format is suitable for paid media and include negative space for headline.
7) Quality Boosters — Include phrases like: global brand advertising style, award-winning campaign visual.
8) Negative Prompting — Add: no distorted anatomy, no extra products, no text artifacts, no watermark.

--------------------------------
INSTRUCTIONS — VIDEO SCENES
--------------------------------

Create a 15–30 second ad: Scene 1 — Hook (scroll-stopping moment). Scene 2 — Problem/Desire (lifestyle aspiration or pain point). Scene 3 — Value Proposition (product as hero). Scene 4 — Social Proof/Emotional Payoff (human connection, success, transformation). Scene 5 — Call To Action (clean brand shot, space for headline).

For each scene define: what is happening visually, camera style (close-up, slow motion, tracking shot, etc.), lighting style, emotional tone.`;
}

function sceneLabelToId(scene: string): string {
  const s = scene.toLowerCase();
  if (s.includes("hook")) return "hook";
  if (s.includes("problem") || s.includes("desire")) return "problem";
  if (s.includes("value") || s.includes("proposition")) return "value";
  if (s.includes("proof") || s.includes("payoff") || s.includes("social")) return "proof";
  if (s.includes("action") || s.includes("cta")) return "cta";
  return "hook";
}

function videoSceneSpecToVideoScene(spec: VideoSceneSpec, index: number): VideoScene {
  const id = (sceneLabelToId(spec.scene) || SCENE_IDS[index]) ?? `scene-${index}`;
  const label = spec.scene || (SCENE_IDS[index] ?? "Scene");
  const text = spec.description || "";
  const visualHint = [spec.visualDirection, spec.camera, spec.lighting, spec.emotion]
    .filter(Boolean)
    .join(", ") || "cinematic";
  return { id, label, text, visualHint };
}

export async function creativePromptBuilderNode(
  state: CampaignGenerationState
): Promise<CampaignGenerationUpdate> {
  const brief = state.campaignBrief;
  if (!brief) return { error: state.error ?? "Campaign brief missing" };
  try {
    const client = getOpenAIClient();
    const res = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: CREATIVE_DIRECTOR_SYSTEM },
        { role: "user", content: buildPromptBuilderPrompt(brief) },
      ],
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return { error: "Empty response from prompt builder" };
    const parsed = JSON.parse(raw) as { imagePrompt?: string; videoScenes?: VideoSceneSpec[] };
    const rawScenes = Array.isArray(parsed.videoScenes) ? parsed.videoScenes : [];
    const scenes: VideoScene[] = rawScenes.length >= 5
      ? rawScenes.map((s, i) => videoSceneSpecToVideoScene(s, i))
      : [
          { id: "hook", label: "Hook", text: brief.emotionalHook ?? "", visualHint: brief.visualStyle ?? "cinematic" },
          { id: "problem", label: "Problem", text: brief.keyMessage ?? "", visualHint: "problem" },
          { id: "value", label: "Value", text: brief.valueProposition ?? "", visualHint: "solution" },
          { id: "proof", label: "Proof", text: brief.campaignConcept ?? "", visualHint: "proof" },
          { id: "cta", label: "CTA", text: brief.callToAction ?? "", visualHint: "call to action" },
        ];
    const creativePrompts: CampaignCreativePrompts = {
      imagePrompt: parsed.imagePrompt ?? "",
      videoScenePlan: {
        title: brief.campaignConcept?.slice(0, 50) ?? "Campaign",
        scenes,
      },
    };
    return { creativePrompts, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Prompt builder failed";
    return { error: message };
  }
}

const VARIANT_TO_PLATFORM_AND_VISUAL: Record<
  GeneratedAdImage["type"],
  { platform: "instagram" | "linkedin" | "story" | "website" | "print"; visualType: "hero" | "lifestyle" | "product" | "banner" }
> = {
  social_post: { platform: "instagram", visualType: "lifestyle" },
  banner: { platform: "website", visualType: "banner" },
  product_focus: { platform: "instagram", visualType: "product" },
};

export async function adImageGenerationNode(
  state: CampaignGenerationState
): Promise<CampaignGenerationUpdate> {
  if (state.jobId) {
    console.log("[campaign-worker] GENERATING IMAGES", state.jobId);
  }
  const prompts = state.creativePrompts;
  const brief = state.campaignBrief;
  if (!prompts?.imagePrompt || !brief) return { error: state.error ?? "Creative prompts missing" };

  const variants: { type: GeneratedAdImage["type"] }[] = [
    { type: "social_post" },
    { type: "banner" },
    { type: "product_focus" },
  ];

  let brandPackaging = "";
  if (state.input?.brandName) {
    try {
      const kit = await getBrandKit(state.input.brandName);
      if (kit.visualStyle) brandPackaging = kit.visualStyle;
    } catch {
      // ignore
    }
  }

  const creativeDirection = {
    creative_strategy: {
      objective: brief.keyMessage ?? brief.campaignConcept ?? "",
      core_emotion: brief.visualStyle ?? brief.emotionalHook ?? "",
      product_role: "hero",
    },
    scene_direction: {
      environment: prompts.imagePrompt,
      composition: "center-weighted",
      lighting: "professional",
    },
    subject_direction: { characters: "" },
    brand_integration: { packaging_visibility: brandPackaging || "premium" },
    copy_layout: { headline_zone: "top" },
  };

  try {
    const campaignId = state.input?.campaignId;
    const results = await Promise.all(
      variants.map(async ({ type }) => {
        const { platform, visualType } = VARIANT_TO_PLATFORM_AND_VISUAL[type];
        const result = await generateCampaignImage({
          creativeDirection,
          platform,
          visualType,
          campaignId,
        });
        const buffer = Buffer.from(result.imageBase64, "base64");
        const storedUrl = await storeAsset("image", buffer, {
          prefix: `campaign-${type.replace("_", "-")}`,
          extension: "png",
        });
        return { type, url: storedUrl };
      })
    );
    const adImages: GeneratedAdImage[] = results;
    return { adImages, error: null };
  } catch (e) {
    if (state.jobId) {
      console.error("[campaign-worker] IMAGE GENERATION FAILED", state.jobId, e);
    }
    const message = e instanceof Error ? e.message : "Ad image generation failed";
    return { error: message };
  }
}

export async function adVideoGenerationNode(
  state: CampaignGenerationState
): Promise<CampaignGenerationUpdate> {
  if (state.jobId) {
    console.log("[campaign-worker] GENERATING VIDEO", state.jobId);
  }
  const prompts = state.creativePrompts;
  if (!prompts?.videoScenePlan?.scenes?.length) {
    return { error: state.error ?? "Video scene plan missing" };
  }

  if (!process.env.XAI_API_KEY?.trim()) {
    return { videoUrl: null, error: null };
  }

  const title = prompts.videoScenePlan.title;
  const scenes = prompts.videoScenePlan.scenes.map((s) => ({
    text: s.text,
    visual_hint: s.visualHint,
  }));

  try {
    const promptText = buildAdVideoPromptFromScript(title, scenes);
    const videoUrl = await generateVideoFromPrompt(promptText);
    return { videoUrl, error: null };
  } catch (e) {
    if (state.jobId) {
      console.error("[campaign-worker] VIDEO GENERATION FAILED", state.jobId, e);
    }
    const message = e instanceof Error ? e.message : "Ad video generation failed";
    return { error: message, videoUrl: null };
  }
}
