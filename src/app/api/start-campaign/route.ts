/**
 * POST /api/start-campaign
 * Body: CampaignCreativeInput (brandName, campaignGoal, channel, ...) or { workspaceId, ...inputs }
 * Requires auth. Creates workspace (if new), user-scoped job, starts processor, returns jobId + workspaceId.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createJob } from "@/lib/jobs/job-store";
import { processCampaignJob } from "@/lib/jobs/process-campaign-job";
import { createWorkspace, getWorkspace } from "@/lib/campaigns/workspace-store";
import type { CampaignCreativeInput } from "@/types/platform";

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request);
    const body = await request.json();
    const input = body as CampaignCreativeInput & { workspaceId?: string };
    if (!input?.brandName || !input?.campaignGoal || !input?.channel) {
      return NextResponse.json(
        { error: "Missing brandName, campaignGoal, or channel" },
        { status: 400 }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set" },
        { status: 503 }
      );
    }
    if (process.env.IMAGE_AGENT === "gemini" && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set (required when IMAGE_AGENT=gemini)" },
        { status: 503 }
      );
    }

    let workspaceId: string;
    const existingWorkspaceId = input.workspaceId;
    if (existingWorkspaceId) {
      const existing = await getWorkspace(user.id, existingWorkspaceId);
      if (!existing) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      workspaceId = existing.id;
    } else {
      const workspace = await createWorkspace(user.id, input);
      workspaceId = workspace.id;
    }

    const job = await createJob(user.id, {
      brandName: input.brandName,
      campaignName: input.campaignGoal,
      workspaceId,
    });
    processCampaignJob(user.id, job.jobId, input).catch(() => {});

    return NextResponse.json({ jobId: job.jobId, workspaceId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start campaign";
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
