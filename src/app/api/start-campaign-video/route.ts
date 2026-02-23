/**
 * POST /api/start-campaign-video
 * Body: { userInput: string, workspaceId?: string, dashboardData?: { brandOverview, campaigns, insights } }
 * Creates a campaign video job, runs processor (Gemini script → OpenAI TTS → Veo), returns jobId.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createJob } from "@/lib/jobs/job-store";
import {
  processCampaignVideoJob,
  type CampaignVideoJobPayload,
} from "@/lib/jobs/process-campaign-video-job";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request);
    const body = await request.json();
    const userInput =
      typeof body?.userInput === "string" ? body.userInput.trim() : "";
    if (!userInput) {
      return NextResponse.json(
        { error: "Missing or empty userInput" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set" },
        { status: 503 }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set" },
        { status: 503 }
      );
    }
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        { error: "Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Netlify environment variables." },
        { status: 503 }
      );
    }

    const payload: CampaignVideoJobPayload = {
      userInput,
      workspaceId: body?.workspaceId,
      dashboardData: body?.dashboardData ?? null,
    };

    const job = await createJob(user.id, {
      campaignName: "Campaign Video",
      jobType: "video",
    });

    processCampaignVideoJob(user.id, job.jobId, payload).catch(() => {});

    return NextResponse.json({ jobId: job.jobId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start campaign video";
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg.includes("Upstash Redis") || msg.includes("UPSTASH_")) {
      return NextResponse.json(
        { error: "Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Netlify environment variables." },
        { status: 503 }
      );
    }
    console.error("[start-campaign-video]", e);
    return NextResponse.json({ error: "Failed to start campaign video" }, { status: 500 });
  }
}
