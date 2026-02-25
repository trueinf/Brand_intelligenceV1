"use client";

import { RadialScore } from "@/components/charts/RadialScore";
import type { Campaign } from "@/types";
import { cn } from "@/lib/utils";

export interface CampaignCardProps {
  campaign: Campaign;
  isSelected?: boolean;
  onClick?: () => void;
  index?: number;
}

const TYPE_BADGES: Record<Campaign["campaign_type"], string> = {
  product: "Product",
  brand: "Brand",
  performance: "Performance",
  offer: "Offer",
};

export function CampaignCard({ campaign, isSelected, onClick, index }: CampaignCardProps) {
  const score = campaign.success_score ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "card-analytics w-full text-left p-4 flex items-start gap-4 transition-all duration-300",
        isSelected && "ring-2 ring-indigo-400/80"
      )}
    >
      <div className="shrink-0">
        <RadialScore value={score} max={10} size={48} strokeWidth={3} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white truncate">{campaign.campaign_name}</p>
        <p className="text-sm text-slate-400 line-clamp-2 mt-0.5">{campaign.objective}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="rounded-md px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300">
            {TYPE_BADGES[campaign.campaign_type] ?? campaign.campaign_type}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
          <span>{campaign.duration}</span>
          <span aria-hidden>·</span>
          <span>{campaign.traffic_share}% traffic</span>
        </div>
      </div>
    </button>
  );
}
