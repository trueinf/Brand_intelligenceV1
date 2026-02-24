import { NextResponse } from "next/server";
import { executeWorkflow, executeWorkflowFast } from "@/lib/langgraph/workflow";
import { generateCampaignBrain } from "@/lib/campaign-brain/generateCampaignBrain";
import { storeCampaignBrain } from "@/lib/campaign-brain-store";

const BRAIN_RACE_MS = 8000;

/**
 * POST /api/analyze-brand
 * Body: { brand: string }
 * Returns: { brand_overview, campaigns, insights, campaignBrainId? } or { error: string }
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brand = typeof body?.brand === "string" ? body.brand.trim() : "";
    if (!brand) {
      return NextResponse.json(
        { error: "Missing or invalid 'brand' in request body" },
        { status: 400 }
      );
    }

    const useFast = process.env.FAST_ANALYSIS === "true";
    const outcome = useFast ? await executeWorkflowFast(brand) : await executeWorkflow(brand);
    if (!outcome.success) {
      return NextResponse.json({ error: outcome.error }, { status: 422 });
    }

    const brainPromise = generateCampaignBrain(outcome.data);
    const brain = await Promise.race([
      brainPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), BRAIN_RACE_MS)),
    ]);

    const response: typeof outcome.data & { campaignBrainId?: string } = { ...outcome.data };
    if (brain) {
      try {
        const campaignBrainId = await storeCampaignBrain(brain);
        response.campaignBrainId = campaignBrainId;
      } catch {
        // Redis not configured or store failed; return without campaignBrainId
      }
    }

    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
