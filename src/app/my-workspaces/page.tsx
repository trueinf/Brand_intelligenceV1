"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, FolderOpen, ImageIcon, ExternalLink, Loader2 } from "lucide-react";
import { getCampaignAuthHeaders } from "@/lib/auth/campaignAuthHeaders";

interface WorkspaceSummary {
  id: string;
  name: string;
  brandName: string;
  lastUpdated: number;
  status: string;
  versionCount: number;
}

export default function MyWorkspacesPage() {
  const [list, setList] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch("/api/my-workspaces", { headers: getCampaignAuthHeaders() });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Failed to load workspaces");
          setList([]);
          return;
        }
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-foreground">My workspaces</h1>
          <nav className="flex gap-2">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <LayoutGrid className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/campaign-studio" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <ImageIcon className="h-4 w-4" /> Campaign Studio
            </Link>
            <Link href="/my-campaigns" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <FolderOpen className="h-4 w-4" /> My campaigns
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <p className="text-sm text-muted-foreground mb-6">Open a workspace to edit inputs, switch versions, and regenerate.</p>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        {!loading && list.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No workspaces yet. Create one from Campaign Studio.</p>
        )}

        {!loading && list.length > 0 && (
          <ul className="space-y-4">
            {list.map((w) => (
              <li key={w.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.brandName} · {w.versionCount} version(s) · {new Date(w.lastUpdated).toLocaleString()}</p>
                </div>
                <Link href={`/campaign/${w.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 shrink-0">
                  <ExternalLink className="h-4 w-4" /> Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
