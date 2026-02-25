"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface CompetitorItem {
  domain: string;
  score: number;
  overlap?: number;
  overlap_score?: number;
}

export interface CompetitorBarListProps {
  competitors: CompetitorItem[];
  maxItems?: number;
  className?: string;
}

function faviconUrl(domain: string): string {
  const d = domain.replace(/^https?:\/\//, "").split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${d}&sz=32`;
}

// Mock data uses placeholder domains that have no real favicon — avoid requesting Google to prevent 404s
function isMockCompetitorDomain(domain: string): boolean {
  const d = domain.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  return /^competitor\d+\.(com|io|co)$/.test(d);
}

// Fallback when favicon 404s or for mock domains (no external request)
const FALLBACK_FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
  );

export function CompetitorBarList({ competitors, maxItems = 5, className }: CompetitorBarListProps) {
  const list = competitors.slice(0, maxItems);
  const maxScore = Math.max(...list.map((c) => c.score ?? c.overlap ?? c.overlap_score ?? 0), 1);
  const [failedFavicons, setFailedFavicons] = useState<Set<string>>(new Set());

  const handleFaviconError = useCallback((domain: string) => {
    setFailedFavicons((prev) => new Set(prev).add(domain));
  }, []);

  if (list.length === 0) {
    return (
      <div className={cn("rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-lg shadow-black/20", className)}>
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Top competitors</h3>
        <p className="text-sm text-slate-400">No competitor data</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300", className)}>
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Top competitors</h3>
      <div className="space-y-3">
        {list.map((c) => {
          const score = c.score ?? c.overlap ?? c.overlap_score ?? 0;
          const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
          const useFallback = isMockCompetitorDomain(c.domain) || failedFavicons.has(c.domain);
          return (
            <div key={c.domain} className="flex items-center gap-3">
              <img
                src={useFallback ? FALLBACK_FAVICON : faviconUrl(c.domain)}
                alt=""
                className="w-5 h-5 rounded shrink-0"
                onError={() => handleFaviconError(c.domain)}
              />
              <span className="text-sm text-slate-300 truncate min-w-0 flex-1">{c.domain}</span>
              <div className="flex-1 min-w-0 max-w-[140px] h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-medium tabular-nums text-white w-8 text-right shrink-0">{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
