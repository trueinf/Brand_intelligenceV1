/**
 * Generate voiceover MP3 from full narration text using OpenAI TTS.
 * Saves to public/audio/ and returns the public URL.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { getOpenAIClient } from "@/lib/openai";

const AUDIO_DIR = "public/audio";
const TTS_MODEL = "gpt-4o-mini-tts";

/**
 * Generate MP3 from narration text, save to public/audio/{slug}.mp3, return audioUrl.
 */
export async function createVoiceover(narrationText: string): Promise<string> {
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
  const dir = join(process.cwd(), AUDIO_DIR);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, `${slug}.mp3`);
  await writeFile(filePath, buffer);

  // Next.js serves public/ at root: public/audio/foo.mp3 → /audio/foo.mp3
  return `/audio/${slug}.mp3`;
}
