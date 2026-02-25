"use client";

import { cn } from "@/lib/utils";

export type AssetGenerationMode = "image" | "video";

interface GenerationModeToggleProps {
  mode: AssetGenerationMode;
  onChange: (mode: AssetGenerationMode) => void;
  className?: string;
}

export function GenerationModeToggle({ mode, onChange, className }: GenerationModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Generation mode"
      className={cn("inline-flex rounded-lg border border-input bg-muted/30 p-0.5", className)}
    >
      <button
        type="button"
        onClick={() => onChange("image")}
        aria-pressed={mode === "image"}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          mode === "image"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Image
      </button>
      <button
        type="button"
        onClick={() => onChange("video")}
        aria-pressed={mode === "video"}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          mode === "video"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Video
      </button>
    </div>
  );
}
