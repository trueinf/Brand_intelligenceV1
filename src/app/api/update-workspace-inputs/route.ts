/**
 * POST /api/update-workspace-inputs
 * Body: { workspaceId: string, inputs: Partial<CampaignInputs> }
 * Requires auth. Updates workspace.inputs only; does not delete versions.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getWorkspace, updateWorkspace } from "@/lib/campaigns/workspace-store";
import type { CampaignInputs } from "@/lib/campaigns/campaign-types";

export async function POST(request: Request) {
  try {
    const user = getCurrentUser(request);
    const body = await request.json();
    const workspaceId = body?.workspaceId as string | undefined;
    const inputs = body?.inputs as Partial<CampaignInputs> | undefined;
    if (!workspaceId || !inputs || typeof inputs !== "object") {
      return NextResponse.json(
        { error: "Missing workspaceId or inputs" },
        { status: 400 }
      );
    }

    const workspace = await getWorkspace(user.id, workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const merged: CampaignInputs = {
      ...workspace.inputs,
      ...inputs,
    };
    await updateWorkspace(user.id, workspaceId, { inputs: merged });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update inputs";
    if (msg === "Not authenticated") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
