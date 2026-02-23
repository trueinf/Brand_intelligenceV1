"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Insights } from "@/types";

export interface StrategicRecommendationCardProps {
  insights: Insights;
}

export function StrategicRecommendationCard({ insights }: StrategicRecommendationCardProps) {
  const text =
    insights.channel_strategy_summary ?? insights.strategic_summary;
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-1">
          <span className="text-sm font-medium text-muted-foreground">
            Strategic recommendation
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">{text}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
