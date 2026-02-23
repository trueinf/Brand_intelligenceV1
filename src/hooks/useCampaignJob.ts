"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getCampaignAuthHeaders } from "@/lib/auth/campaignAuthHeaders";
import type { JobStatusResponse, CampaignJobResult } from "@/types/platform";

const POLL_INTERVAL_MS = 2000;

export interface UseCampaignJobResult {
  status: JobStatusResponse["status"] | null;
  progress: number;
  currentStep: string | undefined;
  result: CampaignJobResult | undefined;
  error: string | null;
  isPolling: boolean;
}

export function useCampaignJob(jobId: string | null): UseCampaignJobResult {
  const [data, setData] = useState<JobStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async (id: string): Promise<JobStatusResponse | { error: string }> => {
    const res = await fetch(`/api/job-status?jobId=${encodeURIComponent(id)}`, {
      headers: getCampaignAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: (err as { error?: string }).error ?? "Failed to fetch job status" };
    }
    return (await res.json()) as JobStatusResponse;
  }, []);

  useEffect(() => {
    if (!jobId) {
      setData(null);
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setIsPolling(true);
    setData({ jobId, status: "pending", progress: 0 });

    const poll = async () => {
      const status = await fetchStatus(jobId);
      if (cancelled) return;
      if ("error" in status && status.error) {
        setData({
          jobId,
          status: "failed",
          error: status.error,
        });
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      const next = status as JobStatusResponse;
      setData(next);
      if (next.status === "completed" || next.status === "failed") {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, fetchStatus]);

  return {
    status: data?.status ?? null,
    progress: data?.progress ?? 0,
    currentStep: data?.currentStep,
    result: data?.result,
    error: data?.error ?? null,
    isPolling,
  };
}
