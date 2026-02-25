"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export interface ChannelMixDonutProps {
  organic: number;
  paid: number;
  social: number;
  direct: number;
  className?: string;
}

const COLORS = { organic: "rgb(52 211 153)", paid: "rgb(167 139 250)", social: "rgb(56 189 248)", direct: "rgb(251 191 36)" };
const LABELS = { organic: "Organic", paid: "Paid", social: "Social", direct: "Direct" };

export function ChannelMixDonut(props: ChannelMixDonutProps) {
  const { organic, paid, social, direct, className } = props;
  const total = organic + paid + social + direct;
  const data = useMemo(() => {
    if (total <= 0) {
      return [
        { name: "organic", value: 1, color: COLORS.organic },
        { name: "paid", value: 1, color: COLORS.paid },
        { name: "social", value: 1, color: COLORS.social },
        { name: "direct", value: 1, color: COLORS.direct },
      ];
    }
    return [
      { name: "organic", value: organic, color: COLORS.organic },
      { name: "paid", value: paid, color: COLORS.paid },
      { name: "social", value: social, color: COLORS.social },
      { name: "direct", value: direct, color: COLORS.direct },
    ].filter((d) => d.value > 0);
  }, [organic, paid, social, direct, total]);

  if (data.length === 0) {
    return (
      <div className={cn("rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 min-h-[200px] shadow-lg shadow-black/20", className)}>
        <p className="text-sm text-slate-400">No channel data</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300", className)}>
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Channel mix</h3>
      <div className="relative flex flex-col items-center">
        <div className="w-full max-w-[200px] h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" paddingAngle={2} dataKey="value" stroke="none">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-lg font-semibold text-white">Mix</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {(["organic", "paid", "social", "direct"] as const).map((key) => (
            <span key={key} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-slate-300" style={{ backgroundColor: `${COLORS[key]}22` }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[key] }} />
              {LABELS[key]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
