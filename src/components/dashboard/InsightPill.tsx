"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InsightPillProps {
  text: string;
  className?: string;
}

export function InsightPill({ text, className }: InsightPillProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-amber-500/10 text-amber-300", className)}>
      <Sparkles className="h-4 w-4 shrink-0" />
      {text}
    </span>
  );
}
