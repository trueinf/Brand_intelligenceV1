/**
 * @deprecated Strategy video (Remotion) removed. Use "Generate campaign video" on the home page (Grok) instead.
 * Kept for backward compatibility with process-campaign-video-job and video-generation graph.
 */

export type VoiceoverResult = { url: string } | { base64: string };

export async function createVoiceover(_narrationText: string): Promise<VoiceoverResult> {
  throw new Error(
    "Strategy voiceover is deprecated. Use the home page and click “Generate campaign video” for Grok-generated campaign video."
  );
}
