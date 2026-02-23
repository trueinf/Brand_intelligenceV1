/**
 * POST /api/compose-poster
 * Body: ComposePosterInput (image_url, layout_map, campaign_copy, brand_kit, platform, campaign_id?)
 *       OR (image_url, creative_brain, campaign_copy, brand_kit?, platform, campaign_id?) to build layout from Creative Brain.
 * Returns: ComposePosterOutput (final_image_url, preview_layers)
 */

import { NextResponse } from "next/server";
import {
  composePoster,
  layoutMapFromCreativeBrain,
  layoutMapFromVisualHierarchy,
} from "@/lib/posterComposer";
import type {
  ComposePosterInput,
  LayoutMap,
  CampaignCopy,
  BrandKit,
  PosterPlatform,
} from "@/lib/posterComposer";
import type { CreativeBrainOutput } from "@/types/campaign-creative-brain";
import { getLayoutPlan } from "@/lib/visual-hierarchy-engine";
import type { VisualHierarchyInput } from "@/lib/visual-hierarchy-engine";

function getBaseUrl(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    if (
      typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
      process.env.NEXT_PUBLIC_APP_URL
    )
      return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    if (typeof process.env.VERCEL_URL === "string")
      return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  }
}

function toAbsoluteUrl(pathOrUrl: string, baseUrl: string): string {
  const s = pathOrUrl.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base = baseUrl.replace(/\/$/, "");
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const baseUrl = getBaseUrl(request);

    const layout_map = body?.layout_map as LayoutMap | undefined;
    const campaign_copy = body?.campaign_copy as CampaignCopy | undefined;
    const brand_kit = body?.brand_kit as BrandKit | undefined;
    const platform = body?.platform as PosterPlatform | undefined;
    const image_url = typeof body?.image_url === "string" ? body.image_url : "";
    const campaign_id =
      typeof body?.campaign_id === "string" ? body.campaign_id : undefined;
    const creative_brain = body?.creative_brain as CreativeBrainOutput | undefined;

    const campaign_goal = typeof body?.campaign_goal === "string" ? body.campaign_goal : undefined;
    const brand_name = typeof body?.brand_name === "string" ? body.brand_name : undefined;
    const primary_channel = typeof body?.primary_channel === "string" ? body.primary_channel : undefined;
    const target_audience = typeof body?.target_audience === "string" ? body.target_audience : undefined;
    const key_message = typeof body?.key_message === "string" ? body.key_message : undefined;
    const emotional_hook = typeof body?.emotional_hook === "string" ? body.emotional_hook : undefined;
    const visual_style = typeof body?.visual_style === "string" ? body.visual_style : undefined;

    const hierarchyDerivedLayout =
      !layout_map && !creative_brain && (campaign_goal ?? brand_name ?? key_message)
        ? (() => {
            const input: VisualHierarchyInput = {
              brandData: { name: brand_name ?? "" },
              campaignData: {
                goal: campaign_goal ?? "",
                channel: primary_channel ?? "",
                audience: target_audience ?? "",
                keyMessage: key_message ?? campaign_copy?.headline ?? "",
              },
              creativeConcept: { mood: emotional_hook, sceneType: visual_style },
              imageMeta: {},
            };
            const plan = getLayoutPlan(input);
            return layoutMapFromVisualHierarchy(plan.placement);
          })()
        : null;

    const resolvedLayoutMap: LayoutMap | null = layout_map
      ? layout_map
      : creative_brain
        ? layoutMapFromCreativeBrain(creative_brain)
        : hierarchyDerivedLayout;
    const resolvedBrandKit: BrandKit = brand_kit ?? {};

    if (!image_url) {
      return NextResponse.json(
        { error: "Missing image_url" },
        { status: 400 }
      );
    }
    if (!resolvedLayoutMap) {
      return NextResponse.json(
        {
          error:
            "Missing layout_map, creative_brain, or campaign context (e.g. campaign_goal, brand_name, key_message) to derive layout from Visual Hierarchy",
        },
        { status: 400 }
      );
    }
    if (!campaign_copy?.headline || !campaign_copy?.cta) {
      return NextResponse.json(
        { error: "Missing campaign_copy (headline and cta required)" },
        { status: 400 }
      );
    }
    const platforms: PosterPlatform[] = [
      "instagram",
      "linkedin",
      "poster",
      "story",
      "website",
    ];
    if (!platform || !platforms.includes(platform)) {
      return NextResponse.json(
        { error: "Missing or invalid platform (use: instagram | linkedin | poster | story | website)" },
        { status: 400 }
      );
    }

    const absoluteImageUrl = toAbsoluteUrl(image_url, baseUrl);
    const brandKitWithAbsoluteLogo =
      resolvedBrandKit?.logo_url && !resolvedBrandKit.logo_url.startsWith("http")
        ? {
            ...resolvedBrandKit,
            logo_url: toAbsoluteUrl(resolvedBrandKit.logo_url, baseUrl),
          }
        : resolvedBrandKit;

    const input: ComposePosterInput = {
      image_url: absoluteImageUrl,
      layout_map: resolvedLayoutMap,
      campaign_copy: {
        headline: campaign_copy.headline,
        subline: campaign_copy.subline ?? "",
        cta: campaign_copy.cta,
        offer: campaign_copy.offer,
      },
      brand_kit: brandKitWithAbsoluteLogo ?? {},
      platform,
      campaign_id,
    };

    const output = await composePoster(input);
    return NextResponse.json(output);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Poster composition failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
