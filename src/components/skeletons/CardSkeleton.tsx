"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CardSkeletonProps {
  className?: string;
  lines?: number;
}

export function CardSkeleton({ className, lines = 3 }: CardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-muted"
            style={{ width: i === lines - 1 && lines > 1 ? "70%" : "100%" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
