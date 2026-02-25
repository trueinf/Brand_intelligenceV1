"use client";

import { cn } from "@/lib/utils";

export interface StackedChannelBarProps {
  organicPct: number;
  paidPct: number;
  otherPct?: number;
  className?: string;
}

export function StackedChannelBar({
  organicPct,
  paidPct,
  otherPct = 0,
  className,
}: StackedChannelBarProps) {
  const total = organicPct + paidPct + otherPct;
  const o = total > 0 ? organicPct / total : 0;
  const p = total > 0 ? paidPct / total : 0;
  const x = 1 - o - p;

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-slate-300">Paid vs Organic</h3>
      <div className="h-8 rounded-lg overflow-hidden flex bg-white/10">
        {o > 0 && (
          <div
            className="flex items-center justify-center bg-emerald-400/90 text-xs font-medium text-slate-900 min-w-[28px] transition-all"
            style={{ width: `${o * 100}%` }}
          >
            {o * 100 >= 12 ? `${Math.round(o * 100)}%` : null}
          </div>
        )}
        {p > 0 && (
          <div
            className="flex items-center justify-center bg-violet-400/90 text-xs font-medium text-white min-w-[28px] transition-all"
            style={{ width: `${p * 100}%` }}
          >
            {p * 100 >= 12 ? `${Math.round(p * 100)}%` : null}
          </div>
        )}
        {x > 0 && (
          <div
            className="flex items-center justify-center bg-white/20 text-xs text-slate-400 min-w-0 transition-all"
            style={{ width: `${x * 100}%` }}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Organic {Math.round(o * 100)}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400" /> Paid {Math.round(p * 100)}%
        </span>
      </div>
    </div>
  );
}
