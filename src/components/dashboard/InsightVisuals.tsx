"use client";

import type { ChannelMix, Insights, SyntheticCompetitor } from "@/types";
import { cn } from "@/lib/utils";

export interface PaidVsOrganicBarsProps {
  channelMix?: ChannelMix | null;
}

export function PaidVsOrganicBars({ channelMix }: PaidVsOrganicBarsProps) {
  if (!channelMix) {
    return <p className="text-sm text-muted-foreground">No channel data</p>;
  }
  const total = channelMix.organic + channelMix.paid + channelMix.social + channelMix.direct;
  const organicPct = total > 0 ? (channelMix.organic / total) * 100 : 0;
  const paidPct = total > 0 ? (channelMix.paid / total) * 100 : 0;
  const otherPct = 100 - organicPct - paidPct;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid vs Organic</h3>
      <div className="h-6 rounded-lg overflow-hidden flex">
        <div
          className="bg-emerald-500/80 transition-all"
          style={{ width: `${organicPct}%` }}
          title={`Organic ${organicPct.toFixed(0)}%`}
        />
        <div
          className="bg-violet-500/80 transition-all"
          style={{ width: `${paidPct}%` }}
          title={`Paid ${paidPct.toFixed(0)}%`}
        />
        <div
          className="bg-muted transition-all"
          style={{ width: `${otherPct}%` }}
          title={`Other ${otherPct.toFixed(0)}%`}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500/80" /> Organic {organicPct.toFixed(0)}%</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-violet-500/80" /> Paid {paidPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export interface MarketPositionMeterProps {
  insights: Insights | null | undefined;
}

const POSITION_LABELS: Record<string, string> = {
  leader: "Leader",
  challenger: "Challenger",
  niche: "Niche",
};

export function MarketPositionMeter({ insights }: MarketPositionMeterProps) {
  const position = insights?.market_position;
  const score = insights?.growth_score ?? 0;
  const pct = Math.min(100, Math.max(0, score * 10));

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market position</h3>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-sm font-medium">
        {position ? POSITION_LABELS[position] ?? position : "—"} {score > 0 && `(${score}/10)`}
      </p>
    </div>
  );
}

export interface CompetitorsBarChartProps {
  competitors?: SyntheticCompetitor[] | null;
}

export function CompetitorsBarChart({ competitors }: CompetitorsBarChartProps) {
  if (!competitors?.length) {
    return <p className="text-sm text-muted-foreground">No competitor data</p>;
  }
  const maxOverlap = Math.max(...competitors.map((c) => c.overlap ?? c.overlap_score ?? 0), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top competitors</h3>
      <div className="space-y-2">
        {competitors.slice(0, 5).map((c) => {
          const v = c.overlap ?? c.overlap_score ?? 0;
          const w = (v / maxOverlap) * 100;
          return (
            <div key={c.domain} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 truncate">{c.domain}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${w}%` }}
                />
              </div>
              <span className="text-xs tabular-nums w-8">{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface ContentStrategyTagsProps {
  insights: Insights | null | undefined;
}

export function ContentStrategyTags({ insights }: ContentStrategyTagsProps) {
  const focus = insights?.content_strategy_focus;
  if (!focus) {
    return <p className="text-sm text-muted-foreground">No content strategy data</p>;
  }
  const tags = focus.split(/[,;]/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content strategy</h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex rounded-lg px-2 py-1 text-xs font-medium",
              "bg-primary/10 text-primary-foreground dark:bg-primary/20"
            )}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
