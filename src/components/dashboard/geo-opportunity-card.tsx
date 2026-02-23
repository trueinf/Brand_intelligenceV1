"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Insights } from "@/types";

export interface GeoOpportunityCardProps {
  insights: Insights;
}

export function GeoOpportunityCard({ insights }: GeoOpportunityCardProps) {
  const topCountry = insights.top_country;
  const opportunities = insights.geo_opportunities ?? [];
  const primary =
    opportunities[0] ??
    (topCountry != null ? `Primary market: ${topCountry}` : null);

  if (primary == null && topCountry == null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-1">
          <span className="text-sm font-medium text-muted-foreground">
            Top geo opportunity
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground">{primary}</p>
          {topCountry != null && primary !== topCountry && (
            <p className="text-xs text-muted-foreground mt-1">
              Top country: {topCountry}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
