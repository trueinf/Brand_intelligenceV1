export interface AssetPromptFormState {
  brandName: string;
  goal: string;
  audience: string;
  channel: string;
  offer: string;
  tone: string;
  cta: string;
  durationSeconds: number;
}

export function defaultAssetPromptFormState(): AssetPromptFormState {
  return {
    brandName: "",
    goal: "",
    audience: "",
    channel: "",
    offer: "",
    tone: "",
    cta: "",
    durationSeconds: 6,
  };
}

export type AssetGenerationMode = "image" | "video";

/** Build the campaign description string used for direct Asset Studio generation. */
export function buildAssetPrompt(form: AssetPromptFormState, mode: AssetGenerationMode): string {
  const parts: string[] = [];
  if (mode === "video") {
    parts.push(`Create a premium social media video${form.offer ? ` for ${form.offer}` : ""}.`);
  } else {
    parts.push(`Create campaign posters${form.offer ? ` for ${form.offer}` : ""}.`);
  }
  if (form.brandName) parts.push(`Brand: ${form.brandName}.`);
  if (form.goal) parts.push(`Goal: ${form.goal}.`);
  if (form.audience) parts.push(`Audience: ${form.audience}.`);
  if (form.channel) parts.push(`Channel: ${form.channel}.`);
  if (form.offer) parts.push(`Offer: ${form.offer}.`);
  if (form.tone) parts.push(`Tone: ${form.tone}.`);
  if (form.cta) parts.push(`Include CTA: ${form.cta}.`);
  if (mode === "video" && form.durationSeconds) {
    parts.push(`Duration: ${form.durationSeconds} seconds.`);
  }
  return parts.join(" ");
}

/** True if form has enough content for direct generation (no prior analysis). */
export function hasDirectPrompt(form: AssetPromptFormState): boolean {
  return [form.brandName, form.goal, form.audience, form.channel, form.offer, form.tone, form.cta].some(
    (s) => typeof s === "string" && s.trim().length > 0
  );
}
