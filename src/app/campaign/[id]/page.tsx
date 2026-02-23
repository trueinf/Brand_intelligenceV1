"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2,
  LayoutGrid,
  FolderOpen,
  ImageIcon,
  RefreshCw,
  Download,
  Copy,
  ChevronRight,
  Video,
} from "lucide-react";
import { getCampaignAuthHeaders } from "@/lib/auth/campaignAuthHeaders";
import { useCampaignJob } from "@/hooks/useCampaignJob";
import type { CampaignWorkspace, CampaignInputs } from "@/lib/campaigns/campaign-types";

export default function CampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CampaignPageContent />
    </Suspense>
  );
}

function CampaignPageContent() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [workspace, setWorkspace] = useState<CampaignWorkspace & { outputs?: unknown } | null>(null);
  const [inputs, setInputs] = useState<CampaignInputs | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const { status: jobStatus, result: jobResult, isPolling } = useCampaignJob(pendingJobId);
  const {
    status: videoStatus,
    progress: videoProgress,
    currentStep: videoStep,
    result: videoResult,
    error: videoError,
    isPolling: videoPolling,
  } = useCampaignJob(videoJobId);

  const fetchWorkspace = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const res = await fetch(`/api/workspace?id=${encodeURIComponent(id)}`, {
        headers: getCampaignAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error ?? "Failed to load workspace");
        setWorkspace(null);
        return;
      }
      const data = await res.json();
      setWorkspace(data);
      setInputs(data.inputs ?? null);
      if (!selectedVersionId) setSelectedVersionId(data.currentVersionId || null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Request failed");
      setWorkspace(null);
    }
  }, [id, selectedVersionId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    if (pendingJobId && jobStatus === "completed") {
      setPendingJobId(null);
      fetchWorkspace();
    }
  }, [pendingJobId, jobStatus, fetchWorkspace]);

  const handleSaveInputs = useCallback(async () => {
    if (!id || !inputs) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/update-workspace-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCampaignAuthHeaders() },
        body: JSON.stringify({ workspaceId: id, inputs }),
      });
      if (res.ok) setSaveStatus("saved");
      else setSaveStatus("idle");
    } catch {
      setSaveStatus("idle");
    }
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [id, inputs]);

  const handleRegenerate = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const res = await fetch("/api/regenerate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCampaignAuthHeaders() },
        body: JSON.stringify({ workspaceId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Regenerate failed");
      if (data.jobId) setPendingJobId(data.jobId);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Regenerate failed");
    }
  }, [id]);

  const handleStartVideo = useCallback(async () => {
    const userInput = videoPrompt.trim() || `Create a short campaign video for ${inputs?.brandName ?? "this brand"} — ${inputs?.campaignGoal ?? "campaign"}`;
    setLoadError(null);
    try {
      const res = await fetch("/api/start-campaign-video", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCampaignAuthHeaders() },
        body: JSON.stringify({ userInput, workspaceId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setLoadError("Rate limit hit. Please try again in a few minutes.");
          return;
        }
        if (res.status === 503) {
          setLoadError(data.error ?? "Campaign video is not configured.");
          return;
        }
        setLoadError(data.error ?? "Failed to start campaign video");
        return;
      }
      if (data.jobId) setVideoJobId(data.jobId);
      else setLoadError("No job ID returned");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to start campaign video");
    }
  }, [id, inputs?.brandName, inputs?.campaignGoal, videoPrompt]);

  const displayOutputs = (() => {
    if (!workspace) return null;
    const vid = selectedVersionId || workspace.currentVersionId;
    const version = workspace.versions?.find((v) => v.id === vid);
    return version?.outputs ?? workspace.outputs ?? null;
  })();

  const images = displayOutputs && typeof displayOutputs === "object" && "images" in displayOutputs
    ? (displayOutputs as { images?: { url: string; prompt?: string }[] }).images
    : [];

  if (!id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Invalid campaign</p>
      </div>
    );
  }

  if (loadError && !workspace) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-destructive">{loadError}</p>
        <Link href="/my-campaigns" className="text-primary mt-2 inline-block">Back to campaigns</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
            {workspace?.name ?? id}
          </h1>
          <nav className="flex gap-2 shrink-0">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"> <LayoutGrid className="h-4 w-4" /> Dashboard </Link>
            <Link href="/campaign-studio" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"> <ImageIcon className="h-4 w-4" /> Studio </Link>
            <Link href="/my-campaigns" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"> My campaigns </Link>
            <Link href="/my-workspaces" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"> Workspaces </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {(isPolling || pendingJobId) && (
          <div className="mb-4 rounded-lg bg-muted/80 px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Generating new version…
          </div>
        )}
        {loadError && workspace && <p className="text-sm text-destructive mb-4">{loadError}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: inputs */}
          <section className="lg:col-span-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Campaign inputs</h2>
            {inputs && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Brand name</label>
                  <input value={inputs.brandName} onChange={(e) => setInputs((i) => (i ? { ...i, brandName: e.target.value } : i))} className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Campaign goal</label>
                  <input value={inputs.campaignGoal} onChange={(e) => setInputs((i) => (i ? { ...i, campaignGoal: e.target.value } : i))} className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Channel</label>
                  <input value={inputs.channel} onChange={(e) => setInputs((i) => (i ? { ...i, channel: e.target.value } : i))} className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm" />
                </div>
                <button type="button" onClick={handleSaveInputs} disabled={saveStatus === "saving"} className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save inputs"}
                </button>
              </div>
            )}
          </section>

          {/* Center: outputs */}
          <section className="lg:col-span-5 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Current outputs</h2>
            {images && images.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, i) => (
                    <div key={`${img.url}-${i}`} className="rounded-lg border border-border overflow-hidden">
                      <a href={img.url} target="_blank" rel="noreferrer" className="block aspect-square">
                        <img src={img.url} alt={`Creative ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                      {img.prompt && <p className="p-2 text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>}
                      <div className="p-2 flex gap-2">
                        <a href={img.url} download className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <Download className="h-3 w-3" /> Download
                        </a>
                        <button type="button" onClick={() => navigator.clipboard.writeText(img.prompt ?? img.url)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <Copy className="h-3 w-3" /> Copy text
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleRegenerate} disabled={!!pendingJobId} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <RefreshCw className="h-4 w-4" /> Regenerate images
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No outputs yet. Run a generation from Campaign Studio or click Regenerate.</p>
            )}
          </section>

          {/* Right: version history */}
          <section className="lg:col-span-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Version history</h2>
            {workspace?.versions?.length ? (
              <ul className="space-y-2">
                {workspace.versions.map((v) => (
                  <li key={v.id}>
                    <button type="button" onClick={() => setSelectedVersionId(v.id)} className={`w-full text-left rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2 ${selectedVersionId === v.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                      <span className="truncate">{new Date(v.createdAt).toLocaleString()}</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No versions yet.</p>
            )}
          </section>
        </div>

        {/* Campaign video (10–20s) */}
        <section className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Video className="h-4 w-4" /> Generate campaign video (10–20s)
          </h2>
          <div className="space-y-3 max-w-xl">
            <input
              type="text"
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="e.g. Show our product in action with a modern feel"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleStartVideo}
              disabled={!!videoJobId && videoPolling}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {videoJobId && videoPolling ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating… {videoProgress}%</>
              ) : (
                <><Video className="h-4 w-4" /> Generate campaign video</>
              )}
            </button>
            {videoJobId && videoPolling && videoStep && (
              <p className="text-xs text-muted-foreground">{videoStep.replace(/_/g, " ")}</p>
            )}
            {videoStatus === "failed" && videoError && (
              <p className="text-sm text-destructive">
                {videoError.includes("Rate limit") || videoError.includes("429")
                  ? "Rate limit hit. Please try again in a few minutes."
                  : videoError}
              </p>
            )}
            {videoStatus === "completed" && videoResult?.videoUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border">
                <video
                  src={videoResult.videoUrl}
                  controls
                  className="w-full aspect-video bg-muted"
                  playsInline
                />
                <p className="p-2 text-xs text-muted-foreground">Campaign video ready</p>
              </div>
            )}
          </div>
        </section>

        {/* Export campaign pack: copy image URLs for now (zip would need client lib) */}
        {images && images.length > 0 && (
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Export</h2>
            <button type="button" onClick={() => navigator.clipboard.writeText(images.map((i) => i.url).join("\n"))} className="inline-flex items-center gap-2 rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted">
              <Copy className="h-4 w-4" /> Copy all image URLs
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
