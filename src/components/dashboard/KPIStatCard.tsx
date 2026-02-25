"use client";

import { cn } from "@/lib/utils";

export interface KPIStatCardProps {
  title: string;
  value: string | number;
  delta?: number | null;
  progress?: number | null;
  className?: string;
}

export function KPIStatCard({ title, value, delta, progress, className }: KPIStatCardProps) {
  const progressPct = progress != null ? Math.min(100, Math.max(0, progress)) : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 backdrop-blur-xl p-5 flex flex-col gap-3",
        "shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300",
        className
      )}
    >
      <p className="text-xs uppercase tracking-widest text-slate-400">{title}</p>
      <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
      {delta != null && (
        <div className={cn("text-xs mt-1 tabular-nums", delta >= 0 ? "text-emerald-400" : "text-red-400")}>
          {delta >= 0 ? "+" : ""}{delta}% vs last month
        </div>
      )}
      {progressPct != null && (
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-auto">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
