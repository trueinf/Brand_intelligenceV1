"use client";

export function KPIRowSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card-analytics p-5 flex flex-col gap-3">
          <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-16 rounded bg-white/10 animate-pulse" />
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-white/20 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
