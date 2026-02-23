/**
 * Runway AI text-to-video API.
 * Requires RUNWAY_API_KEY. Uses REST: POST /v1/text_to_video, then poll GET /v1/tasks/{id}.
 * @see https://docs.dev.runwayml.com/api/
 */

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 300000; // 5 min

function getApiKey(): string {
  const key = process.env.RUNWAY_API_KEY;
  if (!key?.trim()) throw new Error("RUNWAY_API_KEY is not set");
  return key.trim();
}

function headers(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": RUNWAY_VERSION,
  };
}

/** Start text-to-video task. Returns task id. */
async function startTextToVideo(apiKey: string, promptText: string): Promise<string> {
  const body = {
    model: "veo3.1",
    promptText: promptText.slice(0, 1000),
    ratio: "1280:720",
    duration: 5,
  };
  const res = await fetch(`${RUNWAY_BASE}/text_to_video`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? `Runway API error: ${res.status}`);
  }
  if (!data.id) throw new Error("Runway API did not return a task id");
  return data.id;
}

/** Get task status and output. Returns { status, outputUrl? } */
async function getTask(apiKey: string, taskId: string): Promise<{ status: string; outputUrl?: string }> {
  const res = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
    headers: headers(apiKey),
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    output?: string[];
    artifacts?: { url?: string }[];
  };
  if (!res.ok) throw new Error(`Runway task fetch failed: ${res.status}`);
  const status = (data.status ?? "").toLowerCase();
  const outputUrl = data.output?.[0] ?? data.artifacts?.[0]?.url;
  return { status, outputUrl };
}

/**
 * Generate a short video from a text prompt. Polls until complete or timeout.
 * Returns the video URL.
 */
export async function generateVideoFromPrompt(promptText: string): Promise<string> {
  const apiKey = getApiKey();
  const taskId = await startTextToVideo(apiKey, promptText);
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const { status, outputUrl } = await getTask(apiKey, taskId);
    if (status === "succeeded" || status === "success") {
      if (outputUrl) return outputUrl;
    }
    if (status === "failed" || status === "failure") {
      throw new Error("Runway video generation failed");
    }
  }

  throw new Error("Runway video generation timed out");
}

/**
 * Build a single prompt string from a script (title + scenes) for Runway text-to-video.
 */
export function buildRunwayPromptFromScript(
  title: string,
  scenes: { text: string; visual_hint: string }[]
): string {
  const parts = [title];
  for (const s of scenes) {
    parts.push(`${s.text}. Visual: ${s.visual_hint}`);
  }
  return parts.join(" — ").slice(0, 1000);
}
