"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, animate, useTransform } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { StrengthScore as StrengthScoreType } from "@/types/dashboard";

export interface StrengthScoreCardProps {
  data: StrengthScoreType;
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StrengthScoreCard({ data }: StrengthScoreCardProps) {
  const score = Math.min(100, Math.max(0, data.score));
  const strokeDashoffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const color = score >= 70 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-blue-600";

  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    const ctrl = animate(count, score, { duration: 0.8, ease: "easeOut" });
    return () => {
      unsub();
      ctrl.stop();
    };
  }, [score, count, rounded]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5 transition-shadow hover:shadow-md hover:shadow-black/10">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Brand Strength Score
          </h3>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <svg className="h-28 w-28 -rotate-90" viewBox={`0 0 ${RADIUS * 2 + 8} ${RADIUS * 2 + 8}`}>
              <circle
                cx={RADIUS + 4}
                cy={RADIUS + 4}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={6}
                className="text-muted/30"
              />
              <motion.circle
                cx={RADIUS + 4}
                cy={RADIUS + 4}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={6}
                strokeLinecap="round"
                className={score >= 70 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-blue-500"}
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <span
              className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${color}`}
            >
              {display}
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {data.subMetrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((m.max ? m.value / m.max : m.value / 100) * 100).toFixed(0)}%`,
                      }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-foreground">{m.value}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
