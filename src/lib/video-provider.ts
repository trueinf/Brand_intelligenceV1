/**
 * Modular video generation pipeline: routes all generation through the selected provider.
 * VIDEO_PROVIDER=openai | gemini (default: openai)
 */

import { writeFile } from "node:fs/promises";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { generateCampaignImage } from "@/lib/ai/generateCampaignImage";
import type { AnalyzeBrandResponse, VideoStory, VideoScene } from "@/types";
import {
  VIDEO_STORY_SYSTEM_PROMPT,
  buildVideoStoryUserPrompt,
} from "@/agents/video-story-agent";
import { callClaudeJson } from "@/lib/claude/client";

export type VideoProviderName = "openai" | "gemini";

const VIDEO_PROVIDER_ENV = "VIDEO_PROVIDER";

export function getVideoProvider(): VideoProviderName {
  const v = process.env[VIDEO_PROVIDER_ENV]?.toLowerCase();
  if (v === "gemini") return "gemini";
  return "openai";
}

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

// ----- Story (LLM) -----

export async function generateVideoStory(
  dashboardData: AnalyzeBrandResponse
): Promise<VideoStory> {
  const provider = getVideoProvider();
  if (provider === "gemini") {
    return generateVideoStoryGemini(dashboardData);
  }
  return generateVideoStoryOpenAI(dashboardData);
}

async function generateVideoStoryOpenAI(
  dashboardData: AnalyzeBrandResponse
): Promise<VideoStory> {
  const raw = await callClaudeJson<{ scenes: VideoScene[] }>({
    systemPrompt: VIDEO_STORY_SYSTEM_PROMPT,
    userPrompt: buildVideoStoryUserPrompt(dashboardData),
  });
  return normalizeStory(raw);
}

async function generateVideoStoryGemini(
  dashboardData: AnalyzeBrandResponse
): Promise<VideoStory> {
  const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
  const userPrompt = buildVideoStoryUserPrompt(dashboardData);
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { role: "user", parts: [{ text: VIDEO_STORY_SYSTEM_PROMPT + "\n\n" + userPrompt }] },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  const text =
    (response as { text?: string }).text ??
    response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text for video story");
  const parsed = JSON.parse(text) as { scenes?: VideoScene[] };
  return normalizeStory(parsed);
}

function normalizeStory(raw: { scenes?: VideoScene[] }): VideoStory {
  const scenes = Array.isArray(raw.scenes) ? raw.scenes : [];
  const normalized = scenes.map((s) => ({
    title: s.title ?? "",
    narration: s.narration ?? "",
    visual_description: s.visual_description ?? s.visual_prompt ?? "",
    duration: typeof s.duration === "number" ? s.duration : 4,
  }));
  return { scenes: normalized };
}

// ----- Voiceover (TTS) -----

/** Generate voiceover for one scene; writes audio to outputPath (e.g. .mp3). */
export async function generateVoiceover(
  provider: VideoProviderName,
  text: string,
  outputPath: string
): Promise<void> {
  if (provider === "gemini") {
    return generateVoiceoverGemini(text, outputPath);
  }
  return generateVoiceoverOpenAI(text, outputPath);
}

async function generateVoiceoverOpenAI(
  text: string,
  outputPath: string
): Promise<void> {
  const openai = new OpenAI({ apiKey: getOpenAIKey() });
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "onyx",
    input: text.slice(0, 4096),
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

async function generateVoiceoverGemini(
  text: string,
  outputPath: string
): Promise<void> {
  const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ role: "user", parts: [{ text: `Speak this in a clear, professional tone: ${text}` }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
    } as Record<string, unknown>,
  });
  const part = response.candidates?.[0]?.content?.parts?.[0];
  const b64 = (part as { inlineData?: { data?: string } })?.inlineData?.data ?? (part as { text?: string })?.text;
  if (!b64) throw new Error("Gemini TTS returned no audio");
  const buffer = Buffer.from(b64, "base64");
  await writeFile(outputPath, buffer);
}

// ----- Scene image -----

/** Generate a single scene image from description; writes image to outputPath (e.g. .png). */
export async function generateSceneImage(
  provider: VideoProviderName,
  visualDescription: string,
  outputPath: string
): Promise<void> {
  if (provider === "gemini") {
    return generateSceneImageGemini(visualDescription, outputPath);
  }
  return generateSceneImageOpenAI(visualDescription, outputPath);
}

async function generateSceneImageOpenAI(
  visualDescription: string,
  outputPath: string
): Promise<void> {
  const creativeDirection = {
    creative_strategy: { objective: visualDescription.slice(0, 500), core_emotion: "cinematic" },
    scene_direction: { environment: visualDescription, composition: "cinematic", lighting: "professional" },
    subject_direction: { characters: "" },
    brand_integration: { packaging_visibility: "" },
    copy_layout: { headline_zone: "top" },
  };
  const result = await generateCampaignImage({
    creativeDirection,
    platform: "website",
    visualType: "hero",
  });
  await writeFile(outputPath, Buffer.from(result.imageBase64, "base64"));
}

async function generateSceneImageGemini(
  visualDescription: string,
  outputPath: string
): Promise<void> {
  const ai = new GoogleGenAI({ apiKey: getGeminiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-image-generation",
    contents: visualDescription.slice(0, 4000),
  });
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const part = parts.find((p: { inlineData?: { data?: string } }) => (p as { inlineData?: { data?: string } }).inlineData?.data);
  const b64 = (part as { inlineData?: { data?: string } })?.inlineData?.data;
  if (!b64) throw new Error("Gemini image generation returned no data");
  await writeFile(outputPath, Buffer.from(b64, "base64"));
}
