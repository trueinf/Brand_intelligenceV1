"use client";

import { KPIRowSkeleton } from "./KPIRowSkeleton";
import { ChartSkeleton } from "@/components/skeletons/ChartSkeleton";
import { CampaignCardSkeleton } from "./CampaignCardSkeleton";
import { AssetCardSkeleton } from "./AssetCardSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-8">
      <KPIRowSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChartSkeleton height={260} className="rounded-2xl bg-white/5 border border-white/10 shadow-lg shadow-black/20" />
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 h-[260px] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 h-24 animate-pulse" />
        ))}
      </div>
      <div>
        <div className="h-4 w-24 rounded bg-white/10 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AssetCardSkeleton />
          <AssetCardSkeleton />
        </div>
      </div>
      <div>
        <div className="h-4 w-24 rounded bg-white/10 animate-pulse mb-4" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <CampaignCardSkeleton />
          <CampaignCardSkeleton />
        </div>
      </div>
    </div>
  );
}
