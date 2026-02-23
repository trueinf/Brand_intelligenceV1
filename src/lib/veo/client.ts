/**
 * Google Veo video generation client.
 * Uses @google/genai generateVideos + polling. Returns 8–10s MP4 URL or error.
 * Handles 429/500; never throws — returns { videoUrl } or { error }.
 */

import { GoogleGenAI } from "@google/genai";
import { storeAsset } from "@/lib/storage/blob";

const VEO_MODEL = "veo-2.0-generate-001";
const POLL_INTERVAL_MS = 8000;
const POLL_TIMEOUT_MS = 120000; // 120s
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES_429: number = 1;

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  return key;
}

export type VeoGenerateResult = { videoUrl: string } | { error: string; is429?: boolean };

/**
 * Build a single text prompt for Veo from script (title + scenes). Target 10–20s feel.
 */
export function buildVeoPromptFromScript(
  title: string,
  scenes: { text: string; visual_hint: string }[]
): string {
  const parts = [title];
  for (const s of scenes) {
    parts.push(`${s.text}. Visual: ${s.visual_hint}`);
  }
  return parts.join(" — ").slice(0, 2000);
}

/**
 * Generate a short campaign video (text-to-video). Uses async operation + polling.
 * Returns public video URL or error. Never throws.
 */
export async function generateCampaignVideo(
  prompt: string,
  _audioBase64?: string
): Promise<VeoGenerateResult> {
  try {
    const apiKey = getGeminiKey();
    const ai = new GoogleGenAI({ apiKey });

    // Veo 2 supports 4, 6, or 8 seconds. Request 8s.
    const operation = await ai.models.generateVideos({
      model: VEO_MODEL,
      source: { prompt: prompt.slice(0, 2000) },
      config: {
        numberOfVideos: 1,
        durationSeconds: 8,
        aspectRatio: "16:9",
      },
    });

    const deadline = Date.now() + POLL_TIMEOUT_MS;
    let op = operation;

    while (!op.done && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      op = await ai.operations.getVideosOperation({ operation: op });
    }

    if (!op.done) {
      return { error: "Video generation timed out. Try again." };
    }
    if (op.error) {
      const msg = typeof op.error === "object" && op.error && "message" in op.error
        ? String((op.error as { message?: string }).message)
        : "Video generation failed";
      return { error: msg };
    }

    const generated = op.response?.generatedVideos?.[0]?.video;
    if (!generated) {
      return { error: "No video returned from Veo" };
    }

    if (generated.uri) {
      return { videoUrl: generated.uri };
    }
    if (generated.videoBytes) {
      const buffer = Buffer.from(generated.videoBytes, "base64");
      try {
        const url = await storeAsset("video", buffer, {
          prefix: "campaign-video",
          extension: "mp4",
        });
        return { videoUrl: url };
      } catch (storeErr) {
        return {
          error:
            "Video generated but storage unavailable. Configure writable storage (e.g. S3/R2) for serverless.",
        };
      }
    }

    return { error: "No video URL or bytes from Veo" };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : "Video generation failed");
    const is429 =
      err?.status === 429 ||
      String(message).toLowerCase().includes("429") ||
      String(message).toLowerCase().includes("rate limit");
    return { error: message, is429 };
  }
}

/**
 * Generate with optional single retry on 429.
 */
export async function generateCampaignVideoWithRetry(
  prompt: string,
  audioBase64?: string
): Promise<VeoGenerateResult> {
  const first = await generateCampaignVideo(prompt, audioBase64);
  if (!("error" in first) || !first.is429 || MAX_RETRIES_429 === 0) return first;
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  const second = await generateCampaignVideo(prompt, audioBase64);
  if ("error" in second) {
    return { error: "Rate limit hit. Please try again in a few minutes." };
  }
  return second;
}
