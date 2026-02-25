"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  const isChunkError =
    error?.message?.includes("ChunkLoadError") ||
    error?.message?.includes("Loading chunk");

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-foreground">
        {isChunkError ? "Page failed to load" : "Something went wrong"}
      </h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {isChunkError
          ? "A script failed to load (often due to a slow connection or cache). Try again."
          : error?.message ?? "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={() => {
          if (isChunkError) {
            try {
              sessionStorage.removeItem("chunk-load-reload-count");
            } catch {}
          }
          reset();
        }}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
