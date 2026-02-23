"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ChartSkeletonProps {
  className?: string;
  height?: number;
}

export function ChartSkeleton({ className, height = 200 }: ChartSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
      <div
        className="flex items-end justify-between gap-2 animate-pulse"
        style={{ height }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-muted"
            style={{
              height: `${30 + Math.random() * 60}%`,
              minHeight: 24,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
