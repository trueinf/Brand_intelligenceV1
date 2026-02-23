/**
 * GET /api/job-status?jobId=xxx
 * Returns status of an async job (e.g. video render).
 */

import { NextResponse } from "next/server";
import { getJobStatus } from "@/lib/jobs/job-store";

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
