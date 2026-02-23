"use client";

import { useEffect } from "react";

/**
 * Suppress harmless "play() request was interrupted by a call to pause()" (AbortError)
 * from video/audio elements (e.g. Remotion Player, native <video>) when the user or
 * framework calls pause() before play() resolves.
 */
export function UnhandledRejectionHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      if (reason?.name === "AbortError" && typeof reason?.message === "string" && reason.message.includes("play")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return null;
}
