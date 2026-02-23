"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, FolderOpen, ImageIcon, ExternalLink, Loader2 } from "lucide-react";
import { getCampaignAuthHeaders } from "@/lib/auth/campaignAuthHeaders";

interface CampaignListItem {
  jobId: string;
  status: string;
  progress: number;
  createdAt?: number;
  campaignName?: string;
  brandName?: string;
}

export default function MyCampaignsPage() {
  const [list, setList] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch("/api/my-campaigns", {
          headers: getCampaignAuthHeaders(),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Failed to load campaigns");
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">My campaigns</h1>
          <nav className="flex gap-2">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <LayoutGrid className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/campaign-studio" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <ImageIcon className="h-4 w-4" /> Campaign Studio
            </Link>
            <Link href="/assets" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <FolderOpen className="h-4 w-4" /> Assets
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <p className="text-sm text-muted-foreground mb-6">
          Your campaign jobs. Open a result to view creatives.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading…</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        {!loading && list.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No campaigns yet. Create one in Campaign Studio.</p>
        )}

        {!loading && list.length > 0 && (
          <ul className="space-y-4">
            {list.map((item) => (
              <li
                key={item.jobId}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {item.campaignName || item.brandName || "Campaign"}
                    </p>
                    {item.brandName && item.campaignName !== item.brandName && (
                      <p className="text-xs text-muted-foreground truncate">{item.brandName}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {item.status}
                      {item.createdAt != null && (
                        <> · {new Date(item.createdAt).toLocaleString()}</>
                      )}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    href={`/campaign-studio?jobId=${encodeURIComponent(item.jobId)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" /> Open result
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
