"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export interface TrafficTrendDatum {
  month: string;
  organic?: number;
  paid?: number;
  total?: number;
  traffic?: number;
  value?: number;
}

const FALLBACK_DATA: TrafficTrendDatum[] = [
  { month: "Jan", organic: 48, paid: 22 },
  { month: "Feb", organic: 52, paid: 25 },
  { month: "Mar", organic: 58, paid: 24 },
  { month: "Apr", organic: 61, paid: 26 },
  { month: "May", organic: 67, paid: 28 },
  { month: "Jun", organic: 70, paid: 30 },
];

export type TrafficViewMode = "organic" | "paid";

export interface GradientAreaTrafficChartProps {
  data?: TrafficTrendDatum[] | null;
  className?: string;
}

function normalizePoint(raw: Record<string, unknown>): TrafficTrendDatum {
  const month = typeof raw.month === "string" ? raw.month : raw.date != null ? String(raw.date) : "";
  let organic = Number(raw.organic ?? 0) || 0;
  let paid = Number(raw.paid ?? 0) || 0;
  const total = Number(raw.total ?? raw.traffic ?? raw.value ?? 0) || organic + paid;
  if (organic === 0 && paid === 0 && total > 0) {
    organic = total;
  }
  return { month: month.slice(0, 3), organic, paid, total };
}

export function GradientAreaTrafficChart({ data, className }: GradientAreaTrafficChartProps) {
  const [mode, setMode] = useState<TrafficViewMode>("organic");
  const chartData = useMemo(() => {
    const raw = data?.length ? data : FALLBACK_DATA;
    return raw.map((d) => normalizePoint(d as Record<string, unknown>));
  }, [data]);

  const yDomain = useMemo(() => {
    const key = mode === "organic" ? "organic" : "paid";
    const max = chartData.length ? Math.max(...chartData.map((d) => Number(d[key]) ?? 0)) : 0;
    return [0, max > 0 ? max : 1] as [number, number];
  }, [chartData, mode]);

  const isSkeleton = data === undefined;

  if (isSkeleton) {
    return (
      <div className={cn("rounded-2xl bg-white/5 border border-white/10 p-6 h-[320px]", className)}>
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-4">Traffic trend</div>
        <div className="h-full w-full rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">Traffic trend</h3>
        <div className="flex rounded-lg bg-white/10 p-0.5">
          {(["organic", "paid"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors", mode === m ? "bg-white/20 text-white" : "text-slate-400 hover:text-white")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="area-organic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(52 211 153)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(52 211 153)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="area-paid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(167 139 250)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(167 139 250)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }} />
            <YAxis hide domain={yDomain} />
            <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} labelStyle={{ color: "rgb(148,163,184)" }} formatter={(val: number) => [val, ""]} />
            {mode === "organic" && <Area type="monotone" dataKey="organic" stroke="rgb(52 211 153)" fill="url(#area-organic)" strokeWidth={2} />}
            {mode === "paid" && <Area type="monotone" dataKey="paid" stroke="rgb(167 139 250)" fill="url(#area-paid)" strokeWidth={2} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
