/**
 * InVideo AI API wrapper: script → business presentation video.
 * Requires INVIDEO_API_KEY. API base URL may be overridden via INVIDEO_API_BASE.
 */

import type { InVideoScript } from "@/types";

const DEFAULT_BASE = "https://api.invideo.io/v1";

function getApiKey(): string {
  const key = process.env.INVIDEO_API_KEY;
  if (!key) throw new Error("INVIDEO_API_KEY is not set");
  return key;
}

function getBaseUrl(): string {
  return process.env.INVIDEO_API_BASE ?? DEFAULT_BASE;
}

/**
 * Call InVideo API to create a video from script.
 * Uses business presentation style.
 * Returns the video URL when the video is ready (or after polling if the API returns a job id).
 */
export async function generateVideo(script: InVideoScript): Promise<string> {
  const apiKey = getApiKey();
  const base = getBaseUrl().replace(/\/$/, "");
  const createUrl = `${base}/videos`;

  const body = {
    title: script.title,
    scenes: script.scenes.map((s) => ({
      text: s.text,
      visual_hint: s.visual_hint,
    })),
    style: "business_presentation",
    template: "business_presentation",
  };

  const res = await fetch(createUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    video_url?: string;
    url?: string;
    data?: { video_url?: string; url?: string };
    id?: string;
    status?: string;
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    const msg = data.error ?? data.message ?? `InVideo API error: ${res.status}`;
    throw new Error(msg);
  }

  const videoUrl =
    data.video_url ?? data.url ?? data.data?.video_url ?? data.data?.url;
  if (videoUrl) return videoUrl;

  if (data.id && data.status === "processing") {
    const pollUrl = `${base}/videos/${data.id}`;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey },
      });
      const pollData = (await pollRes.json().catch(() => ({}))) as {
        video_url?: string;
        url?: string;
        status?: string;
      };
      if (pollData.video_url ?? pollData.url) return pollData.video_url ?? pollData.url!;
      if (pollData.status === "failed") throw new Error("InVideo rendering failed");
    }
    throw new Error("InVideo video timed out");
  }

  throw new Error("InVideo API did not return a video URL");
}
