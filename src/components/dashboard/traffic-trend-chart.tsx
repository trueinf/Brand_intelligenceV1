"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TrafficTrendPoint } from "@/types";

export interface TrafficTrendChartProps {
  data: TrafficTrendPoint[];
}

export function TrafficTrendChart({ data }: TrafficTrendChartProps) {
  if (!data?.length) return null;

  const maxVal = Math.max(
    ...data.map((d) => d.traffic ?? d.value ?? d.total ?? 0),
    1
  );
  const formatLabel = (d: TrafficTrendPoint) =>
    d.month ?? (d.date != null ? formatDate(d.date) : "");
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
    } catch {
      return d;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Interest / traffic trend
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end gap-1 h-24">
            {data.slice(-12).map((point, i) => {
              const val = point.traffic ?? point.value ?? point.total ?? 0;
              const height = maxVal ? (val / maxVal) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 min-w-0 flex flex-col items-center gap-0.5"
                >
                  <div
                    className="w-full bg-primary/60 rounded-t min-h-[4px] transition-all"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{data.length > 0 ? formatLabel(data[0]) : ""}</span>
            <span>
              {data.length > 0 ? formatLabel(data[data.length - 1]) : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
