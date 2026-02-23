"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, LayoutGrid, FolderOpen, ImageIcon } from "lucide-react";
import type { CampaignCreativeInput } from "@/types/platform";

const initialForm: CampaignCreativeInput = {
  brandName: "",
  campaignGoal: "",
  channel: "",
};

export default function CampaignStudioPage() {
  const [form, setForm] = useState<CampaignCreativeInput>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt?: string }[]>([]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.brandName || !form.campaignGoal || !form.channel) {
        setError("Brand name, campaign goal, and channel are required.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/generate-campaign-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        let data: { imageUrl?: string; prompt?: string; error?: string };
        try {
          data = await res.json();
        } catch {
          setError(
            res.status === 504
              ? "Image generation timed out. Try again or use a shorter prompt."
              : "Generation failed (invalid response). Try again."
          );
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(data.error ?? "Generation failed");
          setLoading(false);
          return;
        }
        setGeneratedImages((prev) => [{ url: data.imageUrl!, prompt: data.prompt ?? "" }, ...prev.slice(0, 9)]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

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
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <p className="text-sm text-muted-foreground mb-6">
          Create campaign creatives from brand and campaign inputs.
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><ImageIcon className="h-4 w-4" /> Generate creative</>}
          </button>
        </form>

        {generatedImages.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Preview grid</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {generatedImages.map((img, i) => (
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
