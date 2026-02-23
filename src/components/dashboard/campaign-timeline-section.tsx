"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CampaignTimelineEvent } from "@/types";

export interface CampaignTimelineSectionProps {
  events: CampaignTimelineEvent[];
}

export function CampaignTimelineSection({ events }: CampaignTimelineSectionProps) {
  if (!events?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Campaign timeline
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-3">
            {events.map((e, i) => (
              <li key={i} className="border-l-2 border-primary/30 pl-3 py-1">
                {(e.period ?? e.duration) != null && (
                  <p className="text-xs text-muted-foreground">
                    {e.period ?? e.duration}
                  </p>
                )}
                <p className="font-medium text-sm">{e.campaign_name}</p>
                {e.channel != null && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {e.channel}
                  </p>
                )}
                {(e.goal ?? e.focus) != null && (
                  <p className="text-xs text-muted-foreground">
                    {e.goal ?? e.focus}
                  </p>
                )}
                {(e.impact_level ?? e.outcome) != null && (
                  <p className="text-xs mt-0.5 capitalize">
                    {e.impact_level != null
                      ? `Impact: ${e.impact_level}`
                      : e.outcome}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
