/**
 * xAI Grok Imagine Video API for campaign ad video.
 * @see https://docs.x.ai/developers/model-capabilities/video/generation
 */

const XAI_BASE = "https://api.x.ai/v1/videos";
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 45 * 60 * 1000; // 45 min (xAI can take many minutes)

function getApiKey(): string {
  const key = process.env.XAI_API_KEY;
  if (!key?.trim()) throw new Error("XAI_API_KEY is not set");
  return key.trim();
}

function headers(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

/** Start video generation. Returns request_id. */
async function startGeneration(
  apiKey: string,
  prompt: string,
  options?: { duration?: number; aspect_ratio?: string; resolution?: string }
): Promise<string> {
  const body = {
    model: "grok-imagine-video",
    prompt: prompt.slice(0, 4000),
    duration: Math.min(15, Math.max(1, options?.duration ?? 5)),
    aspect_ratio: options?.aspect_ratio ?? "16:9",
    resolution: options?.resolution ?? "720p",
  };
  const res = await fetch(`${XAI_BASE}/generations`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { request_id?: string; error?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? `xAI API error: ${res.status}`);
  }
  if (!data.request_id) throw new Error("xAI API did not return a request_id");
  return data.request_id;
}

/** Get video status and URL. Returns { status, url? }. */
async function getVideo(apiKey: string, requestId: string): Promise<{ status: string; url?: string }> {
  const res = await fetch(`${XAI_BASE}/${requestId}`, {
    headers: headers(apiKey),
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    video?: { url?: string };
  };
  if (!res.ok) throw new Error(`xAI video fetch failed: ${res.status}`);
  const status = (data.status ?? "").toLowerCase();
  const url = data.video?.url;
  return { status, url };
}

/**
 * Generate a video from a text prompt. Polls until done or timeout/expired.
 * Returns the video URL.
 */
export async function generateVideoFromPrompt(
  prompt: string,
  options?: { duration?: number; aspect_ratio?: string; resolution?: string }
): Promise<string> {
  const apiKey = getApiKey();
  const requestId = await startGeneration(apiKey, prompt, options);
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  console.log("[xai-video] Polling until deadline in", POLL_TIMEOUT_MS / 60000, "min (requestId:", requestId, ")");

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const { status, url } = await getVideo(apiKey, requestId);
    if (status === "done") {
      if (url) return url;
      throw new Error("xAI video completed but no URL returned");
    }
    if (status === "expired") {
      throw new Error("xAI video request expired");
    }
  }

  throw new Error("xAI video generation timed out");
}

/**
 * Build a single prompt string from a script (title + scenes) for ad video.
 */
export function buildAdVideoPromptFromScript(
  title: string,
  scenes: { text: string; visual_hint: string }[]
): string {
  const parts = [title];
  for (const s of scenes) {
    parts.push(`${s.text}. Visual: ${s.visual_hint}`);
  }
  return parts.join(" — ").slice(0, 2000);
}
