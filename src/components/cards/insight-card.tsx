"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Insights } from "@/types";

export interface InsightCardProps {
  insights: Insights;
  index?: number;
}

export function InsightCard({ insights, index = 0 }: InsightCardProps) {
  const scoreColor =
    insights.growth_score >= 7
      ? "text-emerald-600 dark:text-emerald-400"
      : insights.growth_score >= 4
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Growth score</span>
            <span className={cn("text-2xl font-bold", scoreColor)}>
              {insights.growth_score}/10
            </span>
          </div>
          <p className="text-xs font-medium text-muted-foreground capitalize">
            {insights.market_position}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Paid vs organic strategy</h4>
            <p className="text-muted-foreground">{insights.paid_vs_organic_strategy}</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Market position</h4>
            <p className="text-muted-foreground capitalize">{insights.market_position}</p>
          </div>
          {insights.top_competitors?.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Top competitors</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {insights.top_competitors.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Top country</p>
            <p className="font-medium">{insights.top_country}</p>
          </div>
          {insights.marketing_maturity_level != null && (
            <div>
              <h4 className="font-medium mb-1">Maturity</h4>
              <p className="text-muted-foreground capitalize">
                {insights.marketing_maturity_level.replace(/_/g, " ")}
              </p>
            </div>
          )}
          {insights.channel_strategy_summary != null && (
            <div>
              <h4 className="font-medium mb-1">Channel strategy</h4>
              <p className="text-muted-foreground">{insights.channel_strategy_summary}</p>
            </div>
          )}
          {insights.content_strategy_focus != null && (
            <div>
              <h4 className="font-medium mb-1">Content strategy focus</h4>
              <p className="text-muted-foreground">{insights.content_strategy_focus}</p>
            </div>
          )}
          <div>
            <h4 className="font-medium mb-1">Strategic summary</h4>
            <p className="text-muted-foreground">{insights.strategic_summary}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
