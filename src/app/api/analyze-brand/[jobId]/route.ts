import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AnalyzeBrandResponse } from "@/types";

type RouteParams = { params: Promise<{ jobId: string }> };

type PollResponse = {
  status: string;
  result?: AnalyzeBrandResponse;
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

    let result: AnalyzeBrandResponse | undefined;
    const raw = job.result;
    if (raw != null && typeof raw === "object") {
      result = raw as AnalyzeBrandResponse;
    } else if (typeof raw === "string") {
      try {
        result = JSON.parse(raw) as AnalyzeBrandResponse;
      } catch {
        result = undefined;
      }
    }

    const body: PollResponse = {
      status: job.status,
      result,
      error: job.error ?? undefined,
    };
    return NextResponse.json(body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get job status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
