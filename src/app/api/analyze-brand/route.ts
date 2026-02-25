import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";

export const maxDuration = 10;

/**
 * POST /api/analyze-brand
 * Body: { brand: string }
 * Returns: { jobId, status: "pending" } — poll GET /api/analyze-brand/[jobId] for result.
 */
export async function POST(request: Request) {
  try {
    if (!process.env.INNGEST_EVENT_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "Server configuration error: INNGEST_EVENT_KEY is not set. Add it in Netlify (Site settings → Environment variables) and redeploy.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const brand = typeof body?.brand === "string" ? body.brand.trim() : "";
    if (!brand) {
      return NextResponse.json(
        { error: "Missing or invalid 'brand' in request body" },
        { status: 400 }
      );
    }

    const userId = request.headers.get("x-user-id") ?? null;
    const job = await prisma.analysisJob.create({
      data: { brand, userId, status: "pending" },
    });

    // Set event key at request time (Netlify serverless may not have env at module load)
    const eventKey = process.env.INNGEST_EVENT_KEY?.trim();
    if (eventKey) inngest.setEventKey(eventKey);

    await inngest.send({
      name: "brand/analyze",
      data: { jobId: job.id, brand: job.brand, userId: job.userId ?? undefined },
    });

    return NextResponse.json({ jobId: job.id, status: "pending" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
