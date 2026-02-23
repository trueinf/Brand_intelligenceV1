/**
 * GET /api/job-status?jobId=xxx
 * Requires auth. Returns status of the current user's job only.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getJob } from "@/lib/jobs/job-store";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }
    const job = await getJob(user.id, jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found", jobId }, { status: 404 });
    }
    return NextResponse.json(job);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get job status";
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
