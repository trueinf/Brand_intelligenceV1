/**
 * GET /api/campaign-status?jobId=xxx
 * Returns { status, output?, error? } for a campaign generation job.
 */

import { NextResponse } from "next/server";
import { getCampaignJob } from "@/lib/campaign-job-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId" },
      { status: 400 }
    );
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return NextResponse.json(
      { error: "Redis not configured" },
      { status: 503 }
    );
  }

  try {
    const job = await getCampaignJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found", status: null },
        { status: 404 }
      );
    }

    const response: {
      status: string;
      output?: import("@/types/campaign").CampaignOutput;
      error?: string;
    } = {
      status: job.status,
    };
    if (job.output) response.output = job.output;
    if (job.error) response.error = job.error;

    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get job status";
    console.error("[campaign-status]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
