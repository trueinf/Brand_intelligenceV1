"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { Campaign } from "@/types";
import type { AssetGenerationMode } from "./GenerationModeToggle";

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

function prefilledFromCampaign(campaign: Campaign): Partial<AssetPromptFormState> {
  const ad = campaign.ad_messaging;
  return {
    brandName: "",
    goal: campaign.objective ?? "",
    audience: campaign.main_keyword ? `Target: ${campaign.main_keyword}` : "",
    channel: campaign.campaign_type ?? "",
    offer: ad?.headlines?.[0] ?? campaign.landing_page ?? "",
    tone: "",
    cta: ad?.headlines?.[0] ?? "Learn more",
    durationSeconds: parseDurationToSeconds(campaign.duration) || 6,
  };
}

function parseDurationToSeconds(duration: string | undefined): number | null {
  if (!duration?.trim()) return null;
  const n = parseInt(duration.replace(/\D/g, ""), 10);
  if (duration.toLowerCase().includes("sec")) return n;
  if (duration.toLowerCase().includes("min")) return n * 60;
  return Number.isNaN(n) ? null : n;
}

interface PrefilledPromptFormProps {
  campaign: Campaign | null;
  mode: AssetGenerationMode;
  value: AssetPromptFormState;
  onChange: (state: AssetPromptFormState) => void;
}

const labelClass = "text-sm font-medium text-foreground";

export function PrefilledPromptForm({ campaign, mode, value, onChange }: PrefilledPromptFormProps) {
  const [state, setState] = useState<AssetPromptFormState>(() =>
    campaign ? { ...defaultAssetPromptFormState(), ...prefilledFromCampaign(campaign) } : defaultAssetPromptFormState()
  );

  useEffect(() => {
    if (campaign) {
      setState((prev) => ({ ...prev, ...prefilledFromCampaign(campaign) }));
    }
  }, [campaign]);

  useEffect(() => {
    onChange(state);
  }, [state, onChange]);

  const update = (updates: Partial<AssetPromptFormState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="asset-brand-name" className={labelClass}>Brand Name</label>
        <Input
          id="asset-brand-name"
          value={state.brandName}
          onChange={(e) => update({ brandName: e.target.value })}
          placeholder="e.g. Robert Mondavi"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="asset-goal" className={labelClass}>Goal</label>
        <Input
          id="asset-goal"
          value={state.goal}
          onChange={(e) => update({ goal: e.target.value })}
          placeholder="e.g. increase sales"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="asset-audience" className={labelClass}>Audience</label>
        <Input
          id="asset-audience"
          value={state.audience}
          onChange={(e) => update({ audience: e.target.value })}
          placeholder="e.g. premium wine buyers"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="asset-channel" className={labelClass}>Channel</label>
        <Input
          id="asset-channel"
          value={state.channel}
          onChange={(e) => update({ channel: e.target.value })}
          placeholder="e.g. social, paid"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="asset-offer" className={labelClass}>Offer</label>
        <Input
          id="asset-offer"
          value={state.offer}
          onChange={(e) => update({ offer: e.target.value })}
          placeholder="e.g. Spring Wine Promotion"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="asset-tone" className={labelClass}>Tone</label>
        <Input
          id="asset-tone"
          value={state.tone}
          onChange={(e) => update({ tone: e.target.value })}
          placeholder="e.g. elegant and celebratory"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="asset-cta" className={labelClass}>CTA</label>
        <Input
          id="asset-cta"
          value={state.cta}
          onChange={(e) => update({ cta: e.target.value })}
          placeholder="e.g. Shop now"
        />
      </div>
      {mode === "video" && (
        <div className="space-y-2">
          <label htmlFor="asset-duration" className={labelClass}>Duration (seconds)</label>
          <Input
            id="asset-duration"
            type="number"
            min={1}
            max={15}
            value={state.durationSeconds}
            onChange={(e) => update({ durationSeconds: Math.max(1, Math.min(15, Number(e.target.value) || 6)) })}
          />
        </div>
      )}
    </div>
  );
}
