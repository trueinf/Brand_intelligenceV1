"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/ui/image-lightbox";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
    <ImageLightbox
      open={lightboxOpen && type === "image"}
      src={type === "image" ? src : null}
      alt={label ?? "Asset"}
      onClose={() => setLightboxOpen(false)}
    />
    <div
      className={cn("card-analytics overflow-hidden group", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-video bg-white/5">
        {type === "video" ? (
          <video src={src} className="w-full h-full object-cover" controls playsInline muted />
        ) : (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block w-full h-full cursor-zoom-in text-left"
          >
            <img src={src} alt={label ?? "Asset"} className="w-full h-full object-cover" />
          </button>
        )}
        {hover && (views != null || engagement != null || onRegenerate) && (
          <div
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 p-3 pointer-events-none"
            aria-hidden
          >
            {views != null && <span className="text-sm text-white">Views: {views}</span>}
            {engagement != null && <span className="text-sm text-slate-300">{engagement}</span>}
            {onRegenerate && (
              <span className="pointer-events-auto">
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")} />
                  Regenerate
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="p-3 pt-0 flex items-center justify-between gap-2 flex-wrap">
        {label != null && <p className="text-xs text-slate-400 truncate flex-1 min-w-0">{label}</p>}
        {type === "image" ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
            View full size
          </button>
        ) : (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </a>
        )}
      </div>
    </div>
    </>
  );
}
