/**
 * POST /api/generate-campaign
 * Proxies to Render backend (NEXT_PUBLIC_CAMPAIGN_API_URL). No graph execution on Netlify.
 */

import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_CAMPAIGN_API_URL?.replace(/\/$/, "");
  if (!apiUrl) {
    return NextResponse.json(
      {
        error:
          "Campaign API not configured. Set NEXT_PUBLIC_CAMPAIGN_API_URL to your Render backend URL.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const response = await fetch(`${apiUrl}/generate-campaign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: (data as { error?: string }).error ?? "Campaign generation failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign generation failed";
    console.error("[generate-campaign] proxy error", e);
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
