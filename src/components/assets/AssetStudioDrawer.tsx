"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerationModeToggle, type AssetGenerationMode } from "./GenerationModeToggle";
import { PrefilledPromptForm } from "./PrefilledPromptForm";
import { type AssetPromptFormState, defaultAssetPromptFormState } from "./AssetPromptFormState";
import type { Campaign } from "@/types";
import type { CampaignJobProgress } from "@/types/campaign";

export type AssetJobStatus = "idle" | "generating" | "completed" | "failed";

function buildPrompt(form: AssetPromptFormState, mode: AssetGenerationMode): string {
  const parts: string[] = [];
  if (mode === "video") {
    parts.push(`Create a premium social media video${form.offer ? ` for ${form.offer}` : ""}.`);
  } else {
    parts.push(`Create campaign posters${form.offer ? ` for ${form.offer}` : ""}.`);
  }
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

interface AssetStudioDrawerProps {
  open: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  defaultMode: AssetGenerationMode;
  onGenerate: (mode: AssetGenerationMode) => void;
  imageStatus: AssetJobStatus;
  videoStatus: AssetJobStatus;
  posterProgress?: CampaignJobProgress | null;
  videoProgress?: CampaignJobProgress | null;
  posterError?: string | null;
  videoError?: string | null;
}

export function AssetStudioDrawer({
  open,
  onClose,
  campaign,
  defaultMode,
  onGenerate,
  imageStatus,
  videoStatus,
  posterProgress,
  videoProgress,
  posterError,
  videoError,
}: AssetStudioDrawerProps) {
  const [mode, setMode] = useState<AssetGenerationMode>(defaultMode);
  const [formState, setFormState] = useState<AssetPromptFormState>(() => defaultAssetPromptFormState());

  useEffect(() => {
    if (open) setMode(defaultMode);
  }, [open, defaultMode]);

  const status = mode === "image" ? imageStatus : videoStatus;
  const progress = mode === "image" ? posterProgress : videoProgress;
  const error = mode === "image" ? posterError : videoError;

  const handleGenerate = useCallback(() => {
    onGenerate(mode);
  }, [mode, onGenerate]);

  const promptPreview = buildPrompt(formState, mode);
  const isGenerating = status === "generating";
  const canGenerate = !isGenerating && campaign != null;

  return (
    <>
      <div
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-[480px] max-w-[100vw] bg-white shadow-2xl transition-transform duration-200 ease-out dark:bg-background ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Asset Studio"
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-lg font-semibold text-foreground">Asset Studio</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Mode</p>
              <GenerationModeToggle mode={mode} onChange={setMode} />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Prompt</p>
              <PrefilledPromptForm campaign={campaign} mode={mode} value={formState} onChange={setFormState} />
            </div>

            {promptPreview && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Preview</p>
                <p className="text-sm text-foreground">{promptPreview}</p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
              {status === "idle" && (
                <p className="text-sm text-foreground">Idle — click Generate to start.</p>
              )}
              {status === "generating" && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Generating asset…</span>
                </div>
              )}
              {status === "generating" && progress != null && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-[width] duration-300"
                      style={{
                        width: `${progress.overallPercent ?? (progress as { percent?: number }).percent ?? 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {progress.step ?? progress.image?.step ?? progress.video?.step ?? "In progress…"}
                  </p>
                </div>
              )}
              {status === "completed" && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Completed</span>
                </div>
              )}
              {status === "failed" && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error ?? "Generation failed."}</span>
                </div>
              )}
            </div>
          </div>

          <footer className="border-t border-border px-4 py-3">
            <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </footer>
        </div>
      </aside>
    </>
  );
}
