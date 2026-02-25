import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { BrandAnalysisResult } from "@/types/analysis";

type RouteParams = { params: Promise<{ jobId: string }> };

type PollResponse = {
  status: string;
  result?: BrandAnalysisResult;
  error?: string;
};

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

    const job = await prisma.analysisJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body: PollResponse = {
      status: job.status,
      result: (job.result as BrandAnalysisResult | null) ?? undefined,
      error: job.error ?? undefined,
    };
    return NextResponse.json(body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get job status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
