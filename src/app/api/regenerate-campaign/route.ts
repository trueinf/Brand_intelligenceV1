import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getWorkspace } from "@/lib/campaigns/workspace-store";
import { createJob } from "@/lib/jobs/job-store";
import { processCampaignJob } from "@/lib/jobs/process-campaign-job";

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request);
    const body = await request.json();
    const workspaceId = body?.workspaceId as string | undefined;
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

    const workspace = await getWorkspace(user.id, workspaceId);
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const inputs = {
      brandName: workspace.inputs.brandName,
      campaignGoal: workspace.inputs.campaignGoal,
      channel: workspace.inputs.channel,
      audience: workspace.inputs.audience,
      tone: workspace.inputs.tone,
      keyMessage: workspace.inputs.keyMessage,
      visualStyle: workspace.inputs.visualStyle,
      brandId: workspace.inputs.brandId,
    };

    const job = await createJob(user.id, {
      brandName: inputs.brandName,
      campaignName: inputs.campaignGoal,
      workspaceId,
    });
    processCampaignJob(user.id, job.jobId, inputs).catch(() => {});

    return NextResponse.json({ jobId: job.jobId, workspaceId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to regenerate";
    if (msg === "Not authenticated") return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
