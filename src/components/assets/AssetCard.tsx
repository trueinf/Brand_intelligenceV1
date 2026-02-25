"use client";

import { Download, RefreshCw, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AssetStatus = "ready" | "failed" | "generating";

interface AssetCardBaseProps {
  status: AssetStatus;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  label: string;
  className?: string;
}

interface ImageAssetCardProps extends AssetCardBaseProps {
  type: "image";
  url: string;
}

interface VideoAssetCardProps extends AssetCardBaseProps {
  type: "video";
  url: string | null;
  error?: string | null;
}

export type AssetCardProps = ImageAssetCardProps | VideoAssetCardProps;

function StatusBadge({ status }: { status: AssetStatus }) {
  const styles = {
    ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    generating: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  };
  const labels = { ready: "Ready", failed: "Failed", generating: "Generating" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {status === "generating" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {labels[status]}
    </span>
  );
}

export function AssetCard(props: AssetCardProps) {
  const { status, onRegenerate, isRegenerating, label, type } = props;
  const url = type === "image" ? props.url : props.url;
  const canDownload = (url?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md"
      )}
    >
      <div className="relative aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden">
        {type === "image" && props.url ? (
          <img src={props.url} alt={label} className="h-full w-full object-cover" />
        ) : type === "video" ? (
          props.url ? (
            <video
              src={props.url}
              className="h-full w-full object-contain bg-black"
              controls
              playsInline
              muted
              preload="metadata"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
              {props.error ? (
                <p className="text-sm text-destructive">{props.error}</p>
              ) : status === "generating" ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : (
                <p className="text-sm">No video</p>
              )}
            </div>
          )
        ) : null}
        <div className="absolute top-2 right-2">
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3 border-t border-border">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {canDownload && (
            <a
              href={url!}
              download={type === "image" ? `${label.replace(/\s+/g, "-")}.png` : "campaign-video.mp4"}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 inline-flex items-center justify-center")}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          )}
          {onRegenerate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={onRegenerate}
              disabled={isRegenerating || status === "generating"}
            >
              {isRegenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
