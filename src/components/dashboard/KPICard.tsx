"use client";

import { cn } from "@/lib/utils";

export interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number | null;
  sparkline?: number[];
  className?: string;
}

export function KPICard({ icon, label, value, trend, sparkline, className }: KPICardProps) {
  const trendUp = trend != null && trend >= 0;
  const trendDown = trend != null && trend < 0;

  return (
    <div
      className={cn(
        "card-premium p-4 flex flex-col gap-2",
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
        {trend != null && (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              trendUp && "text-emerald-600 dark:text-emerald-400",
              trendDown && "text-red-600 dark:text-red-400"
            )}
          >
            {trendUp ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      {sparkline != null && sparkline.length > 0 && (
        <div className="flex items-end gap-0.5 h-6 mt-1">
          {sparkline.map((v, i) => {
            const max = Math.max(...sparkline);
            const height = max > 0 ? Math.max(4, (v / max) * 100) : 0;
            return (
              <div
                key={i}
                className="flex-1 min-w-0 rounded-sm bg-primary/30 dark:bg-primary/40 transition-all"
                style={{ height: `${height}%` }}
                title={String(v)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
