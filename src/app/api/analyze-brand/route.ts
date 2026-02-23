import { NextResponse } from "next/server";
import { executeWorkflow } from "@/lib/langgraph/workflow";

/**
 * POST /api/analyze-brand
 * Body: { brand: string }
 * Returns: { brand_overview, campaigns, insights } or { error: string }
 */
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

    const outcome = await executeWorkflow(brand);
    if (!outcome.success) {
      return NextResponse.json({ error: outcome.error }, { status: 422 });
    }

    return NextResponse.json(outcome.data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
