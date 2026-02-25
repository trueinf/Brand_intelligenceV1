import { NextResponse } from "next/server";
import { executeWorkflow, executeWorkflowFast } from "@/lib/langgraph/workflow";
import { generateCampaignBrain } from "@/lib/campaign-brain/generateCampaignBrain";
import { storeCampaignBrain } from "@/lib/campaign-brain-store";

const BRAIN_RACE_MS = 8000;
/** Netlify's gateway often times out at ~30s; return 503 before that so client gets JSON instead of 504. */
const WORKFLOW_TIMEOUT_MS_NETLIFY = 28_000;
const WORKFLOW_TIMEOUT_MS_DEFAULT = 55_000;

function isNetlify(): boolean {
  return (
    process.env.NETLIFY === "true" ||
    typeof process.env.NETLIFY_SITE_NAME === "string" ||
    (typeof process.env.URL === "string" && process.env.URL.includes("netlify.app"))
  );
}

/**
 * POST /api/analyze-brand
 * Body: { brand: string }
 * Returns: { brand_overview, campaigns, insights, traffic_trend?, synthetic_data?, campaignBrainId? } or { error: string }
 *
 * On Netlify we always use the fast path (mock + 2 LLM calls) to avoid timeouts.
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

    const useFast = process.env.FAST_ANALYSIS === "true" || isNetlify();
    const workflowTimeoutMs = isNetlify() ? WORKFLOW_TIMEOUT_MS_NETLIFY : WORKFLOW_TIMEOUT_MS_DEFAULT;
    const workflowPromise = useFast ? executeWorkflowFast(brand) : executeWorkflow(brand);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("WORKFLOW_TIMEOUT")), workflowTimeoutMs)
    );
    let outcome;
    try {
      outcome = await Promise.race([workflowPromise, timeoutPromise]);
    } catch (err) {
      if (err instanceof Error && err.message === "WORKFLOW_TIMEOUT") {
        return NextResponse.json(
          { error: "Analysis took too long. Click Analyze again—retries often succeed." },
          { status: 503 }
        );
      }
      throw err;
    }
    if (!outcome.success) {
      return NextResponse.json({ error: outcome.error }, { status: 422 });
    }

    const brainRaceMs = isNetlify() ? 3000 : BRAIN_RACE_MS;
    const brainPromise = generateCampaignBrain(outcome.data);
    const brain = await Promise.race([
      brainPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), brainRaceMs)),
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
