"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  const isChunkError =
    error?.message?.includes("ChunkLoadError") ||
    error?.message?.includes("Loading chunk");

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          {isChunkError ? "App failed to load" : "Something went wrong"}
        </h2>
        <p style={{ color: "#666", marginBottom: "1.5rem", maxWidth: "28rem", margin: "0 auto 1.5rem" }}>
          {isChunkError
            ? "A script failed to load. Try again or refresh the page."
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
            window.location.href = "/";
          }}
          style={{
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
