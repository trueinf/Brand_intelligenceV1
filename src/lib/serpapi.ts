/**
 * SerpAPI YouTube search. Fetches brand YouTube videos for Active Campaign Creatives.
 */

import type { YouTubeCreative } from "@/types";

const SERPAPI_BASE = "https://serpapi.com/search";

function getApiKey(): string | null {
  return process.env.SERPAPI_KEY ?? null;
}

interface SerpApiVideoResult {
  title?: string;
  link?: string;
  thumbnail?: { static?: string } | string;
  views?: number | string;
}

interface SerpApiYouTubeResponse {
  video_results?: SerpApiVideoResult[];
  error?: string;
}

export async function fetchYouTubeVideosForBrand(
  brandName: string,
  limit = 8
): Promise<YouTubeCreative[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      engine: "youtube",
      search_query: brandName,
      api_key: apiKey,
    });
    const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SerpApiYouTubeResponse;
    if (data.error || !Array.isArray(data.video_results)) return [];

    return data.video_results.slice(0, limit).map((v) => ({
      title: v.title ?? "",
      thumbnail: typeof v.thumbnail === "string" ? v.thumbnail : v.thumbnail?.static ?? "",
      views: v.views ?? 0,
      link: v.link ?? "",
    }));
  } catch {
    return [];
  }
}
