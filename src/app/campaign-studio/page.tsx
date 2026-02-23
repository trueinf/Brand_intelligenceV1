"use client";

import { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, LayoutGrid, FolderOpen, ImageIcon, History } from "lucide-react";
import { useCampaignJob } from "@/hooks/useCampaignJob";
import { getCampaignAuthHeaders } from "@/lib/auth/campaignAuthHeaders";
import type { CampaignCreativeInput } from "@/types/platform";

const initialForm: CampaignCreativeInput = {
  brandName: "",
  campaignGoal: "",
  channel: "",
};

function CampaignStudioContent() {
  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get("jobId");
  const [form, setForm] = useState<CampaignCreativeInput>(initialForm);
  const [jobId, setJobId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const effectiveJobId = useMemo(() => jobId ?? jobIdFromUrl, [jobId, jobIdFromUrl]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt?: string }[]>([]);

  const { status, progress, currentStep, result, error: jobError, isPolling } = useCampaignJob(effectiveJobId);

  const loading = isPolling || (status !== null && status !== "completed" && status !== "failed");

  useEffect(() => {
    if (status === "completed" && result?.images?.length && jobId) {
      setGeneratedImages((prev) => [...result.images!, ...prev].slice(0, 10));
      setJobId(null);
    }
  }, [status, result?.images, jobId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.brandName || !form.campaignGoal || !form.channel) {
        setSubmitError("Brand name, campaign goal, and channel are required.");
        return;
      }
      setSubmitError(null);
      setJobId(null);
      try {
        const res = await fetch("/api/start-campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getCampaignAuthHeaders() },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setSubmitError(data.error ?? "Failed to start campaign");
          return;
        }
        if (data.jobId) {
          setJobId(data.jobId);
          if (data.workspaceId) setWorkspaceId(data.workspaceId);
        } else {
          setSubmitError("No job ID returned");
        }
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Request failed");
      }
    },
    [form]
  );

  const displayError = submitError ?? jobError ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Campaign Studio</h1>
          <nav className="flex gap-2">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <LayoutGrid className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/assets" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <FolderOpen className="h-4 w-4" /> Assets
            </Link>
            <Link href="/my-campaigns" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <History className="h-4 w-4" /> My campaigns
            </Link>
            <Link href="/my-workspaces" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              Workspaces
            </Link>
            {workspaceId && (
              <Link href={`/campaign/${workspaceId}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-primary hover:bg-primary/10">
                Open workspace
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <p className="text-sm text-muted-foreground mb-6">
          Create campaign creatives from brand and campaign inputs. Generation runs in the background; images appear as they’re ready.
        </p>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Brand name *</label>
            <input
              type="text"
              value={form.brandName}
              onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Campaign goal *</label>
            <input
              type="text"
              value={form.campaignGoal}
              onChange={(e) => setForm((f) => ({ ...f, campaignGoal: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. Lead generation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Channel *</label>
            <input
              type="text"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. Paid social, LinkedIn"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Audience</label>
            <input
              type="text"
              value={form.audience ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value || undefined }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. B2B decision makers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Key message</label>
            <input
              type="text"
              value={form.keyMessage ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, keyMessage: e.target.value || undefined }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. Save 20% on your first year"
            />
          </div>
          {displayError && <p className="text-sm text-destructive">{displayError}</p>}
          {(loading && currentStep) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{currentStep.replace(/_/g, " ")}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><ImageIcon className="h-4 w-4" /> Generate creative</>
            )}
          </button>
        </form>

        {((result?.images?.length ? result.images : generatedImages).length > 0) && (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              {result?.images?.length ? "Current" : "Preview"} grid
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(result?.images?.length ? result.images : generatedImages).map((img, i) => (
                <div key={`${img.url}-${i}`} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <a href={img.url} target="_blank" rel="noreferrer" className="block aspect-square">
                    <img src={img.url} alt={`Creative ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                  {img.prompt && <p className="p-2 text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function CampaignStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <CampaignStudioContent />
    </Suspense>
  );
}
