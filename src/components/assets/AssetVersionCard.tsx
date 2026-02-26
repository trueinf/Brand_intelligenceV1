"use client";

import { useState, useEffect, useRef } from "react";
import { Download, RefreshCw, Loader2, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/downloadFile";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { AssetVersion, CampaignOutput, CampaignJobProgress } from "@/types/campaign";

const POLL_INTERVAL_MS = 1000;

interface AssetVersionCardProps {
  jobId: string;
  mode: "image" | "video";
  currentJobId?: string | null;
  version: number;
  label: string;
  campaignApiBase: string | null;
  initial?: Partial<Pick<AssetVersion, "status" | "output" | "error" | "progress">>;
  onStatusChange: (update: Partial<AssetVersion>) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  imageTypeLabels?: Record<string, string>;
}

export function AssetVersionCard({
  jobId,
  mode,
  currentJobId,
  version,
  label,
  campaignApiBase,
  initial = {},
  onStatusChange,
  onRegenerate,
  isRegenerating,
  expanded,
  onToggleExpand,
  imageTypeLabels = {},
}: AssetVersionCardProps) {
  const [status, setStatus] = useState<AssetVersion["status"]>(initial.status ?? "queued");
  const [progress, setProgress] = useState<CampaignJobProgress | undefined>(initial.progress);
  const [output, setOutput] = useState<CampaignOutput | undefined>(initial.output);
  const [error, setError] = useState<string | undefined>(initial.error);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setDownloadToast(message);
    toastTimerRef.current = setTimeout(() => {
      setDownloadToast(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  const statusUrl =
    campaignApiBase != null
      ? `${campaignApiBase}/campaign-status?jobId=${encodeURIComponent(jobId)}`
      : `/api/campaign-status?jobId=${encodeURIComponent(jobId)}`;

  useEffect(() => {
    if (jobId === currentJobId) return;
    if (status === "completed" || status === "failed") return;

    const poll = async () => {
      try {
        const res = await fetch(statusUrl, { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          status?: string;
          output?: CampaignOutput;
          error?: string;
          progress?: CampaignJobProgress;
        };
        if (res.status === 404) {
          setStatus("failed");
          setError("Job not found or expired");
          onStatusChange({ status: "failed", error: "Job not found or expired" });
          return;
        }
        if (!res.ok) {
          setStatus("failed");
          const err = data.error ?? "Failed to get status";
          setError(err);
          onStatusChange({ status: "failed", error: err });
          return;
        }
        const s = (data.status ?? "").toLowerCase();
        if (data.progress != null) {
          setProgress(data.progress);
          onStatusChange({ progress: data.progress });
        }
        if (s === "running") {
          setStatus("running");
          onStatusChange({ status: "running" });
          return;
        }
        if (s === "completed" && data.output) {
          setStatus("completed");
          setOutput(data.output);
          setError(undefined);
          onStatusChange({ status: "completed", output: data.output });
          return;
        }
        if (s === "failed") {
          setStatus("failed");
          const err = data.error ?? "Generation failed";
          setError(err);
          onStatusChange({ status: "failed", error: err });
          return;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        setStatus("failed");
        setError(msg);
        onStatusChange({ status: "failed", error: msg });
      }
    };

    poll();
    pollingRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [jobId, currentJobId, statusUrl, status, onStatusChange]);

  useEffect(() => {
    const isCurrentJob = jobId === currentJobId;
    const isTerminalFromParent = initial.status === "completed" || initial.status === "failed";
    if (!isCurrentJob && !isTerminalFromParent) return;
    if (initial.status != null) setStatus(initial.status);
    if (initial.progress !== undefined) setProgress(initial.progress);
    if (initial.output !== undefined) setOutput(initial.output);
    if (initial.error !== undefined) setError(initial.error);
  }, [jobId, currentJobId, initial.status, initial.progress, initial.output, initial.error]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const isDone = status === "completed" || status === "failed";
  const canDownload = status === "completed" && output != null;
  const videoUrl = mode === "video" ? output?.videoUrl : null;
  const adImages = mode === "image" ? output?.adImages : [];

  const percent = progress?.overallPercent ?? progress?.image?.percent ?? progress?.video?.percent ?? 0;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggleExpand}
        className={cn(
          "flex items-center justify-between w-full rounded-lg border border-border bg-card/80 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            v{version}
          </span>
          <span className="text-sm text-foreground">{label}</span>
          <StatusChip status={status} />
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
        <button type="button" onClick={onToggleExpand} className="flex items-center gap-2 text-left">
          <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">v{version}</span>
          <span className="text-sm font-medium text-foreground">{label}</span>
          <StatusChip status={status} />
        </button>
      </div>

      <div className="relative aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden min-h-[160px]">
        {status === "completed" && mode === "image" && (adImages?.length ?? 0) > 0 && (
          <>
            <ImageLightbox
              open={lightboxUrl != null}
              src={lightboxUrl}
              alt="Campaign image"
              onClose={() => setLightboxUrl(null)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full h-full p-1">
              {(adImages ?? []).slice(0, 4).map((img) =>
                img.url ? (
                  <button
                    key={img.type}
                    type="button"
                    onClick={() => setLightboxUrl(img.url ?? null)}
                    className="block overflow-hidden rounded cursor-zoom-in text-left"
                  >
                    <img src={img.url} alt={imageTypeLabels[img.type] ?? img.type} className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div key={img.type} className="flex items-center justify-center rounded bg-muted/50 text-xs text-muted-foreground">
                    Asset not ready
                  </div>
                )
              )}
            </div>
          </>
        )}
        {status === "completed" && mode === "video" && videoUrl && (
          <video
            src={videoUrl}
            className="h-full w-full object-contain bg-black"
            controls
            playsInline
            muted
            preload="metadata"
          />
        )}
        {(status === "queued" || status === "running") && (
          <div className="flex flex-col items-center gap-3 p-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <div className="w-full max-w-[200px]">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {progress?.step ?? progress?.image?.step ?? progress?.video?.step ?? "In progress…"}
              </p>
            </div>
          </div>
        )}
        {status === "failed" && (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="text-sm text-destructive">{error ?? "Failed"}</p>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onRegenerate} disabled={isRegenerating}>
              {isRegenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Retry
            </Button>
          </div>
        )}
      </div>

      {downloadToast && (
        <div className="px-3 py-1.5 text-xs text-foreground bg-muted border-t border-border" role="status">
          {downloadToast}
        </div>
      )}
      {isDone && status === "completed" && (
        <div className="flex items-center gap-2 p-3 border-t border-border flex-wrap">
          {canDownload && mode === "video" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!videoUrl}
              onClick={async () => {
                if (!videoUrl) {
                  showToast("Asset not ready");
                  return;
                }
                try {
                  await downloadFile(videoUrl, "campaign-video.mp4");
                } catch {
                  showToast("Download failed");
                }
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          )}
          {canDownload && mode === "image" && (adImages?.length ?? 0) > 0 && (
            <>
              {(adImages ?? []).map((img) => {
                const label = (imageTypeLabels?.[img.type] ?? img.type).slice(0, 12);
                const filename = `${(imageTypeLabels?.[img.type] ?? img.type).replace(/\s+/g, "-")}.png`;
                const hasUrl = Boolean(img.url);
                return (
                  <Button
                    key={img.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={!hasUrl}
                    onClick={async () => {
                      if (!img.url) {
                        showToast("Asset not ready");
                        return;
                      }
                      try {
                        await downloadFile(img.url, filename);
                      } catch {
                        showToast("Download failed");
                      }
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                );
              })}
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: AssetVersion["status"] }) {
  const styles: Record<AssetVersion["status"], string> = {
    queued: "bg-muted text-muted-foreground",
    running: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    failed: "bg-destructive/15 text-destructive border border-destructive/30",
  };
  const labels: Record<AssetVersion["status"], string> = {
    queued: "Queued",
    running: "Generating",
    completed: "Ready",
    failed: "Failed",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", styles[status])}>
      {status === "running" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {labels[status]}
    </span>
  );
}
