"use client";

import { useCallback, useRef, useState, useEffect } from "react";

const isDev =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

export type UsePollingOptions<T> = {
  pollFn: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  stopWhen?: (data: T) => boolean;
  onSuccess?: (data: T) => void;
  onError?: (err: unknown) => void;
};

export function usePolling<T>({
  pollFn,
  interval = 1000,
  enabled = true,
  stopWhen,
  onSuccess,
  onError,
}: UsePollingOptions<T>): {
  start: () => void;
  stop: () => void;
  isRunning: boolean;
} {
  const [isRunning, setIsRunning] = useState(false);
  const isPollingRef = useRef(false);
  const cancelledRef = useRef(false);
  const optionsRef = useRef({
    pollFn,
    interval,
    stopWhen,
    onSuccess,
    onError,
  });
  optionsRef.current = { pollFn, interval, stopWhen, onSuccess, onError };

  const stop = useCallback(() => {
    cancelledRef.current = true;
    isPollingRef.current = false;
    setIsRunning(false);
    if (isDev) console.log("[polling] stop");
  }, []);

  const start = useCallback(() => {
    if (isPollingRef.current) {
      if (isDev) console.log("[polling] start skipped (already running)");
      return;
    }
    if (!enabled) {
      if (isDev) console.log("[polling] start skipped (disabled)");
      return;
    }
    isPollingRef.current = true;
    cancelledRef.current = false;
    setIsRunning(true);
    if (isDev) console.log("[polling] start");

    const run = async () => {
      while (!cancelledRef.current) {
        const {
          pollFn: fn,
          interval: ms,
          stopWhen: stopWhenFn,
          onSuccess: onSuccessCb,
          onError: onErrorCb,
        } = optionsRef.current;
        try {
          if (isDev) console.log("[polling] tick");
          const data = await fn();
          if (cancelledRef.current) break;
          onSuccessCb?.(data);
          if (cancelledRef.current) break;
          if (stopWhenFn?.(data)) {
            if (isDev) console.log("[polling] stop (stopWhen)");
            break;
          }
          await new Promise<void>((r) => setTimeout(r, ms));
        } catch (err) {
          optionsRef.current.onError?.(err);
          if (isDev) console.log("[polling] error", err);
          break;
        }
      }
      isPollingRef.current = false;
      setIsRunning(false);
    };

    run();
  }, [enabled]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      isPollingRef.current = false;
      if (isDev) console.log("[polling] cleanup (unmount)");
    };
  }, []);

  return { start, stop, isRunning };
}
