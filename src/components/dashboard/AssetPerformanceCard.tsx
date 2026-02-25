"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AssetPerformanceCardProps {
  type: "image" | "video";
  src: string;
  label?: string;
  views?: number | string;
  engagement?: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export function AssetPerformanceCard({
  type,
  src,
  label,
  views,
  engagement,
  onRegenerate,
  isRegenerating,
  className,
}: AssetPerformanceCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={cn("card-analytics overflow-hidden group", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-video bg-white/5">
        {type === "video" ? (
          <video src={src} className="w-full h-full object-cover" controls playsInline muted />
        ) : (
          <img src={src} alt={label ?? "Asset"} className="w-full h-full object-cover" />
        )}
        {hover && (views != null || engagement != null || onRegenerate) && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 p-3">
            {views != null && <span className="text-sm text-white">Views: {views}</span>}
            {engagement != null && <span className="text-sm text-slate-300">{engagement}</span>}
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
      {label != null && <p className="p-3 text-xs text-slate-400 truncate">{label}</p>}
    </div>
  );
}
