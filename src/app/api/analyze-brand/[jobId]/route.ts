import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db/prisma";

type RouteParams = { params: Promise<{ jobId: string }> };

/**
 * GET /api/analyze-brand/[jobId]
 * Returns job status and, when completed, result (or error when failed).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await getPrisma().analysisJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      result: job.result ?? undefined,
      error: job.error ?? undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get job status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
