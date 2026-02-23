/**
 * Google Trends interest over time for a brand.
 * Maps to traffic_trend chart in UI. Uses SerpAPI Google Trends when SERPAPI_KEY is set.
 */

import type { TrafficTrendPoint } from "@/types";

function getApiKey(): string | null {
  return process.env.SERPAPI_KEY ?? null;
}

interface SerpApiTrendsResponse {
  interest_over_time?: {
    timeline_data?: Array<{ date: string; values?: Array<{ value: number }> }>;
  };
  error?: string;
}

/**
 * Fetch interest over time for brand name. Returns array of { date, value } for chart.
 * Requires SERPAPI_KEY (SerpAPI Google Trends API).
 */
export async function fetchInterestOverTime(
  brandName: string
): Promise<TrafficTrendPoint[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: "google_trends",
      q: brandName,
      api_key: apiKey,
    });
    const res = await fetch(
      `https://serpapi.com/search?${params.toString()}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as SerpApiTrendsResponse;
    if (data.error || !data.interest_over_time?.timeline_data) return [];

    return data.interest_over_time.timeline_data.map((d) => ({
      date: d.date,
      value: d.values?.[0]?.value ?? 0,
    }));
  } catch {
    return [];
  }
}
