"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AnalyzeBrandResponse } from "@/types";
import type { DashboardData, DashboardStatus } from "@/types/dashboard";
import { getMockDashboardData } from "@/lib/data/mock-dashboard-data";
import { apiToDashboardData } from "@/lib/data/api-to-dashboard";

interface DashboardContextValue {
  status: DashboardStatus;
  loading: boolean;
  error: string | null;
  data: DashboardData | null;
  apiResult: AnalyzeBrandResponse | null;
  analyzingBrand: string | null;
  search: (brand: string) => Promise<void>;
  retry: () => void;
  setData: (data: DashboardData | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DashboardStatus>("empty");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setDataState] = useState<DashboardData | null>(null);
  const [apiResult, setApiResult] = useState<AnalyzeBrandResponse | null>(null);
  const [analyzingBrand, setAnalyzingBrand] = useState<string | null>(null);
  const [lastSearchedBrand, setLastSearchedBrand] = useState<string | null>(null);

  const search = useCallback(async (brand: string) => {
    const query = brand.trim();
    if (!query) return;
    setLastSearchedBrand(query);
    setLoading(true);
    setError(null);
    setAnalyzingBrand(query);
    setStatus("loading");
    try {
      const res = await fetch("/api/analyze-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: query }),
      });
      let json: AnalyzeBrandResponse & { error?: string };
      try {
        json = await res.json();
      } catch {
        setError(
          res.status === 504
            ? "Request timed out. Brand analysis can take a minute—try again."
            : "Analysis failed (invalid response). Try again."
        );
        setStatus("error");
        setApiResult(null);
        setDataState(getMockDashboardData(query));
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Analysis failed");
        setStatus("error");
        setApiResult(null);
        setDataState(getMockDashboardData(query));
        return;
      }
      const result = json as AnalyzeBrandResponse;
      setApiResult(result);
      setDataState(apiToDashboardData(result, query));
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setStatus("error");
      setApiResult(null);
      setDataState(getMockDashboardData(query));
    } finally {
      setLoading(false);
      setAnalyzingBrand(null);
    }
  }, []);

  const retry = useCallback(() => {
    setError(null);
    const toSearch = lastSearchedBrand || data?.brandName;
    if (toSearch) search(toSearch);
  }, [lastSearchedBrand, data?.brandName, search]);

  const setData = useCallback((next: DashboardData | null) => {
    setDataState(next);
    setStatus(next ? "success" : "empty");
  }, []);

  const value = useMemo<DashboardContextValue>(
    () => ({
      status,
      loading,
      error,
      data,
      apiResult,
      analyzingBrand,
      search,
      retry,
      setData,
    }),
    [status, loading, error, data, apiResult, analyzingBrand, search, retry, setData]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
