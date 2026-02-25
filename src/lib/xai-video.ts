/**
 * xAI Grok Imagine Video API for campaign ad video.
 * @see https://docs.x.ai/developers/model-capabilities/video/generation
 */

const XAI_BASE = "https://api.x.ai/v1/videos";
const POLL_INTERVAL_MS = 3000; // faster status checks (~10–30s faster perceived completion)
const POLL_TIMEOUT_MS = 45 * 60 * 1000; // 45 min (xAI can take many minutes)
const FETCH_TIMEOUT_MS = 90 * 1000; // 90s per request so one hung response doesn't block forever

function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = FETCH_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(() => clearTimeout(timer));
}

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
  options?: { duration?: number; aspect_ratio?: string; resolution?: string; maxPromptLength?: number }
): Promise<string> {
  const maxLen = options?.maxPromptLength ?? 4000;
  const body = {
    model: "grok-imagine-video",
    prompt: prompt.slice(0, maxLen),
    duration: Math.min(15, Math.max(1, options?.duration ?? 5)),
    aspect_ratio: options?.aspect_ratio ?? "16:9",
    resolution: options?.resolution ?? "720p",
  };
  const res = await fetchWithTimeout(`${XAI_BASE}/generations`, {
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

/** Get video status and URL. Returns { status, url?, errorMessage? }. */
async function getVideo(
  apiKey: string,
  requestId: string
): Promise<{ status: string; url?: string; errorMessage?: string }> {
  const res = await fetchWithTimeout(`${XAI_BASE}/${requestId}`, {
    headers: headers(apiKey),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("[xai-video] non-200:", res.status, text);
    throw new Error(`xAI video fetch failed: ${res.status} — ${text.slice(0, 200)}`);
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    console.error("[xai-video] invalid JSON:", text.slice(0, 200));
    throw new Error("xAI video API returned invalid JSON");
  }

  const data = json as {
    status?: string;
    data?: { status?: string; video?: { url?: string } };
    result?: { status?: string };
    video?: { url?: string };
    error?: string;
    message?: string;
  };

  const statusRaw =
    data.status ??
    (data.data && typeof data.data === "object" && "status" in data.data ? (data.data as { status?: string }).status : undefined) ??
    (data.result && typeof data.result === "object" && "status" in data.result ? (data.result as { status?: string }).status : undefined);

  const videoUrl = data.video?.url ?? data.data?.video?.url;
  const status = (statusRaw ?? "").toString().toLowerCase();
  const errorMessage = data.error ?? data.message;

  console.log("[xai-video] RAW:", JSON.stringify(json));
  console.log("[xai-video] status:", status);

  // Grok success Shape B: no "status" field but video.url present = done
  if (!status && videoUrl) {
    return { status: "done", url: videoUrl, errorMessage };
  }
  if (!status) {
    throw new Error("Grok returned no status field");
  }

  return { status, url: videoUrl, errorMessage };
}

/**
 * Generate a video from a text prompt. Polls until done or timeout/expired.
 * Returns the video URL.
 */
export async function generateVideoFromPrompt(
  prompt: string,
  options?: { duration?: number; aspect_ratio?: string; resolution?: string; maxPromptLength?: number }
): Promise<string> {
  const apiKey = getApiKey();
  const requestId = await startGeneration(apiKey, prompt, options);
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  console.log("[xai-video] Polling until deadline in", POLL_TIMEOUT_MS / 60000, "min (requestId:", requestId, ")");

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    let status: string;
    let url: string | undefined;
    let errorMessage: string | undefined;
    try {
      const result = await getVideo(apiKey, requestId);
      status = result.status;
      url = result.url;
      errorMessage = result.errorMessage;
    } catch (e) {
      const isTimeout = (e as Error)?.name === "AbortError" || (e as Error)?.message?.includes("abort");
      if (isTimeout) {
        console.warn("[xai-video] Status request timed out, retrying...");
        continue;
      }
      throw e;
    }
    // status already logged in getVideo (with RAW response)
    if (status === "done") {
      if (url) return url;
      throw new Error("xAI video completed but no URL returned");
    }
    if (status === "failed" || status === "error" || status === "canceled" || status === "cancelled") {
      throw new Error(errorMessage ? `xAI video failed: ${errorMessage}` : `xAI video failed (status: ${status})`);
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
