"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types";

export interface CampaignCardProps {
  campaign: Campaign;
  isSelected?: boolean;
  onClick?: () => void;
  index?: number;
}

const TYPE_COLORS: Record<Campaign["campaign_type"], string> = {
  product: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  brand: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  performance: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  offer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

export function CampaignCard({ campaign, isSelected, onClick, index = 0 }: CampaignCardProps) {
  const typeColor = TYPE_COLORS[campaign.campaign_type] ?? "bg-neutral-500/15 text-neutral-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all hover:border-primary/40 hover:shadow-lg rounded-xl shadow-sm",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold truncate">{campaign.campaign_name}</span>
            <span
              className={cn(
                "rounded-lg px-2 py-0.5 text-xs font-medium capitalize",
                typeColor
              )}
            >
              {campaign.campaign_type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Success score: {campaign.success_score}/10</span>
            <span>·</span>
            <span>{campaign.traffic_share}% traffic</span>
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{campaign.objective}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
