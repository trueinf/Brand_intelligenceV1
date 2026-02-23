/**
 * Generate voiceover MP3 from full narration text using OpenAI TTS.
 * Saves to public/audio/ when writable, else returns base64 for serverless (e.g. Netlify).
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getOpenAIClient } from "@/lib/openai";

const AUDIO_DIR = "public/audio";
const TTS_MODEL = "gpt-4o-mini-tts";

export type VoiceoverResult = { url: string } | { base64: string };

/**
 * Generate MP3 from narration text. Returns public URL if public/audio is writable,
 * otherwise base64 (e.g. on Netlify serverless where filesystem is read-only).
 */
export async function createVoiceover(narrationText: string): Promise<VoiceoverResult> {
  const openai = getOpenAIClient();
  const text = narrationText.trim().slice(0, 4096);
  if (!text) throw new Error("Narration text is empty");

  const response = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice: "onyx",
    input: text,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const slug = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const publicDir = join(process.cwd(), AUDIO_DIR);
  const publicPath = join(publicDir, `${slug}.mp3`);
  try {
    await mkdir(publicDir, { recursive: true });
    await writeFile(publicPath, buffer);
    return { url: `/audio/${slug}.mp3` };
  } catch {
    return { base64: buffer.toString("base64") };
  }
}
