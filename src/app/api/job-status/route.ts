/**
 * GET /api/job-status?jobId=xxx
 * Returns status of an async job (e.g. video render). In-memory for now; replace with DB/Redis later.
 */

import { NextResponse } from "next/server";
import type { JobStatusResponse } from "@/types/platform";

const jobStore = new Map<string, JobStatusResponse>();

export function setJobStatus(jobId: string, data: Partial<JobStatusResponse>): void {
  const existing = jobStore.get(jobId) ?? { jobId, status: "pending" };
  jobStore.set(jobId, { ...existing, ...data });
}

export function getJobStatus(jobId: string): JobStatusResponse | null {
  return jobStore.get(jobId) ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }
  const status = getJobStatus(jobId);
  if (!status) {
    return NextResponse.json({ error: "Job not found", jobId }, { status: 404 });
  }
  return NextResponse.json(status);
}
