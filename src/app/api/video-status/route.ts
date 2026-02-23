import { NextResponse } from "next/server";
import { getVideoJob } from "@/lib/video-jobs";

/**
 * GET /api/video-status?jobId=xxx
 * Returns: job object { status, progress, videoUrl?, error? } or 404 JSON.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId" },
      { status: 400 }
    );
  }
  const job = getVideoJob(jobId);
  if (!job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    video_url: job.videoUrl,
    error: job.error,
  });
}
