/**
 * POST /api/generate-poster-direct
 * Single-step poster: no image URL required. Uses a default gradient background and
 * composes event-style poster (kicker, headline, date, subline, CTA, logo) from user input.
 * Body: { campaignBrief, brandName?, eventDate?, eventTime?, eventLocation?, brandLogoUrl?, ... }
 * Returns: same as generate-poster { posters, copy, campaignInfo }.
 */

import { NextResponse } from "next/server";
import { createDefaultPosterBackground } from "@/lib/poster-engine/default-poster-background";
import { storeAsset } from "@/lib/storage/blob";
import type { CampaignBrief } from "@/types/campaign";
import type { CampaignInfoInput } from "@/lib/campaign-info/campaign-info.types";

function getBaseUrl(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    if (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL)
      return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    if (typeof process.env.VERCEL_URL === "string")
      return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const campaignBrief = body?.campaignBrief as CampaignBrief | undefined;
    const brandName = typeof body?.brandName === "string" ? body.brandName : null;
    const eventDate = typeof body?.eventDate === "string" ? body.eventDate : undefined;
    const eventTime = typeof body?.eventTime === "string" ? body.eventTime : undefined;
    const eventLocation = typeof body?.eventLocation === "string" ? body.eventLocation : undefined;
    const brandLogoUrl = typeof body?.brandLogoUrl === "string" ? body.brandLogoUrl : null;
    const brandLogoLightUrl = typeof body?.brandLogoLightUrl === "string" ? body.brandLogoLightUrl : null;
    const brandLogoDarkUrl = typeof body?.brandLogoDarkUrl === "string" ? body.brandLogoDarkUrl : null;

    if (!campaignBrief?.keyMessage) {
      return NextResponse.json(
        { error: "Missing campaignBrief.keyMessage" },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(request);

    // Build campaignInfoInput for event-style poster (required for informative blocks)
    const valueProp = (campaignBrief.valueProposition ?? campaignBrief.keyMessage ?? "").trim();
    const campaignInfoInput: CampaignInfoInput | undefined =
      (brandName ?? "").trim() && valueProp
        ? {
            brandName: (brandName ?? "").trim(),
            campaignObjective: "event",
            valueProposition: valueProp,
            targetAudience: campaignBrief.targetAudience ?? "",
            brandTone: campaignBrief.visualStyle ?? "",
            date: eventDate,
            time: eventTime,
            location: eventLocation,
          }
        : undefined;

    // Create default gradient background and store to get a URL
    const backgroundBuffer = await createDefaultPosterBackground(1080, 1350);
    const backgroundPath = await storeAsset("image", backgroundBuffer, {
      prefix: "poster-bg",
      extension: "png",
    });
    const imageUrl = backgroundPath.startsWith("http") ? backgroundPath : `${baseUrl}${backgroundPath}`;

    // Call existing generate-poster logic via internal fetch (same origin)
    const res = await fetch(`${baseUrl}/api/generate-poster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        campaignBrief,
        brandName: brandName ?? undefined,
        brandLogoUrl: brandLogoUrl ?? undefined,
        brandLogoLightUrl: brandLogoLightUrl ?? undefined,
        brandLogoDarkUrl: brandLogoDarkUrl ?? undefined,
        campaignInfoInput: campaignInfoInput ?? undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Direct poster generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
