/**
 * POST /api/creative-brain
 * Body: CreativeBrainInput (brand, product, campaign_goal, target_audience, key_message, offer?, channel, visual_tone, occasion?, season?, brand_kit?)
 * Returns: CreativeBrainOutput (creative_strategy, scene_direction, subject_direction, brand_integration, copy_layout, platform_adaptation, image_generation_prompt, video_storyboard)
 */

import { NextResponse } from "next/server";
import { generateCreativeDirection } from "@/lib/campaign-creative-brain/creative-brain.service";
import type { CreativeBrainInput } from "@/types/campaign-creative-brain";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input: CreativeBrainInput = {
      brand: String(body?.brand ?? ""),
      product: String(body?.product ?? ""),
      campaign_goal: String(body?.campaign_goal ?? ""),
      target_audience: String(body?.target_audience ?? ""),
      key_message: String(body?.key_message ?? ""),
      offer: body?.offer != null ? String(body.offer) : undefined,
      channel: String(body?.channel ?? ""),
      visual_tone: String(body?.visual_tone ?? ""),
      occasion: body?.occasion != null ? String(body.occasion) : undefined,
      season: body?.season != null ? String(body.season) : undefined,
      brand_kit:
        body?.brand_kit && typeof body.brand_kit === "object"
          ? {
              logo_url: (body.brand_kit as Record<string, unknown>).logo_url as string | undefined,
              colors: (body.brand_kit as Record<string, unknown>).colors as string[] | undefined,
              fonts: (body.brand_kit as Record<string, unknown>).fonts as
                | { headline?: string; body?: string }
                | undefined,
              tone: (body.brand_kit as Record<string, unknown>).tone as string | undefined,
            }
          : undefined,
    };

    if (!input.brand || !input.campaign_goal || !input.key_message) {
      return NextResponse.json(
        { error: "Missing required fields: brand, campaign_goal, key_message" },
        { status: 400 }
      );
    }

    const output = await generateCreativeDirection(input);
    return NextResponse.json(output);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Creative Brain failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
