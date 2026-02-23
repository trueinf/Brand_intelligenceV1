/**
 * POST /api/generate-campaign-image
 * Body: CampaignCreativeInput (brandName, campaignGoal, channel, audience?, tone?, keyMessage?, visualStyle?, brandId?)
 * Flow: load brand rules → build master prompt → OpenAI image → store asset → return image URL.
 */

import { NextResponse } from "next/server";
import { runCampaignImageWorkflow } from "@/langgraph/campaign-image-graph";
import type { CampaignCreativeInput } from "@/types/platform";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = body as CampaignCreativeInput;
    if (!input?.brandName || !input?.campaignGoal || !input?.channel) {
      return NextResponse.json(
        { error: "Missing brandName, campaignGoal, or channel" },
        { status: 400 }
      );
    }

    const state = await runCampaignImageWorkflow(input);
    if (state.error) {
      return NextResponse.json({ error: state.error }, { status: 422 });
    }
    const imageUrl = state.storedUrl ?? state.imageUrl;
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL produced" }, { status: 500 });
    }

    return NextResponse.json({
      imageUrl,
      prompt: state.masterPrompt,
      inputParams: input,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
