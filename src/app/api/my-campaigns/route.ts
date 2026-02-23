/**
 * GET /api/my-campaigns
 * Requires auth. Returns current user's campaign jobs, newest first.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { listUserJobs } from "@/lib/jobs/job-store";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);
    const jobs = await listUserJobs(user.id);
    const list = jobs.map((j) => ({
      jobId: j.jobId,
      status: j.status,
      progress: j.progress ?? 0,
      createdAt: j.createdAt,
      campaignName: j.campaignName,
      brandName: j.brandName,
    }));
    return NextResponse.json(list);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list campaigns";
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
