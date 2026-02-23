"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { ContentOpportunity } from "@/lib/data/mock-dashboard-data";

export interface ContentOpportunityCardProps {
  data: ContentOpportunity | null;
}

const opportunityColors = {
  high: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
  medium: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  low: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
};

export function ContentOpportunityCard({ data }: ContentOpportunityCardProps) {
  if (!data) return null;

  const style = opportunityColors[data.opportunity];
  const isHigh = data.opportunity === "high";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-sm shadow-black/5 transition-shadow hover:shadow-md hover:shadow-black/10 hover:border-primary/30">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Content Opportunity
          </h3>
        </CardHeader>
        <CardContent>
          <div
            className={`rounded-xl border p-4 ${style} ${isHigh ? "shadow-sm shadow-green-500/20" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="text-sm font-semibold capitalize">{data.opportunity} opportunity</span>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">&ldquo;{data.keyword}&rdquo;</p>
            <p className="text-xs opacity-90">{data.rationale}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
