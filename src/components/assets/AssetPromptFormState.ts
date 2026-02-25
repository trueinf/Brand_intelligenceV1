export interface AssetPromptFormState {
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
    goal: "",
    audience: "",
    channel: "",
    offer: "",
    tone: "",
    cta: "",
    durationSeconds: 6,
  };
}
