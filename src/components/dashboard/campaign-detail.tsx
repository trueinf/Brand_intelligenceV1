"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types";

export interface CampaignDetailProps {
  campaign: Campaign | null;
  brandName?: string;
}

const TYPE_COLORS: Record<Campaign["campaign_type"], string> = {
  product: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  brand: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  performance: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  offer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

export function CampaignDetail({ campaign, brandName }: CampaignDetailProps) {
  if (!campaign) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[280px] text-muted-foreground rounded-xl shadow-sm">
        <CardContent className="pt-6 text-center">
          <p className="text-sm">
            {brandName
              ? "Select a campaign to view details"
              : "Enter a brand and run analysis to see campaigns"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const typeColor = TYPE_COLORS[campaign.campaign_type] ?? "bg-neutral-500/15";

  return (
    <motion.div
      key={campaign.campaign_name}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">{campaign.campaign_name}</h2>
            <span className={cn("rounded-lg px-2 py-0.5 text-xs font-medium capitalize", typeColor)}>
              {campaign.campaign_type}
            </span>
            <span className="text-sm text-muted-foreground">
              Success: {campaign.success_score}/10 · {campaign.traffic_share}% traffic
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h4 className="text-sm font-medium mb-1">Overview</h4>
            <p className="text-sm text-muted-foreground">{campaign.objective}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Landing page</h4>
            <a
              href={campaign.landing_page}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {campaign.landing_page}
            </a>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Ad messaging</h4>
            <div className="space-y-2 text-sm">
              {campaign.ad_messaging.headlines?.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Headlines: </span>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    {campaign.ad_messaging.headlines.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {campaign.ad_messaging.descriptions?.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Descriptions: </span>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    {campaign.ad_messaging.descriptions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Main keyword</p>
              <p className="font-medium">{campaign.main_keyword}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CPC</p>
              <p className="font-medium">${campaign.cpc.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium">{campaign.duration}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Traffic share</p>
              <p className="font-medium">{campaign.traffic_share}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
