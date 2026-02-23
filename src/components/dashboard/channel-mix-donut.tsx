"use client";

import { motion } from "framer-motion";
import type { ChannelMix } from "@/types";

export interface ChannelMixDonutProps {
  channelMix: ChannelMix;
}

const COLORS = ["#22c55e", "#eab308", "#8b5cf6", "#0ea5e9"];
const LABELS = ["Organic", "Paid", "Social", "Direct"];

export function ChannelMixDonut({ channelMix }: ChannelMixDonutProps) {
  const values = [
    channelMix.organic,
    channelMix.paid,
    channelMix.social,
    channelMix.direct,
  ];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let offset = 0;
  const segments = values.map((v, i) => {
    const pct = (v / total) * 100;
    const segment = { color: COLORS[i], label: LABELS[i], pct, offset };
    offset += pct;
    return segment;
  });

  const r = 40;
  const C = 2 * Math.PI * r;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((s, i) => {
            const strokeDasharray = `${(s.pct / 100) * C} ${C}`;
            const strokeDashoffset = -(s.offset / 100) * C;
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            );
          })}
          <circle cx="50" cy="50" r="28" fill="hsl(var(--card))" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">Mix</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-xs">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-foreground">
              {s.label} {s.pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
