"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MarketingMaturityLevel } from "@/types";

export interface MaturityCardProps {
  level: MarketingMaturityLevel;
}

const LABELS: Record<MarketingMaturityLevel, string> = {
  starter: "Starter",
  growth: "Growth",
  performance_leader: "Performance leader",
};

const STYLES: Record<MarketingMaturityLevel, string> = {
  starter: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  growth: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  performance_leader: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

export function MaturityCard({ level }: MaturityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-1">
          <span className="text-sm font-medium text-muted-foreground">
            Marketing maturity
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <span
            className={cn(
              "inline-block rounded-lg px-3 py-1.5 text-sm font-medium capitalize",
              STYLES[level]
            )}
          >
            {LABELS[level]}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}
