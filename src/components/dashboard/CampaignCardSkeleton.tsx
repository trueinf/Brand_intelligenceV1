"use client";

export function CampaignCardSkeleton() {
  return (
    <div className="card-analytics p-4 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-full rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
