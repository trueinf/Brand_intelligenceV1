"use client";

export function AssetCardSkeleton() {
  return (
    <div className="card-analytics overflow-hidden">
      <div className="aspect-video bg-white/10 animate-pulse" />
      <div className="p-3">
        <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
