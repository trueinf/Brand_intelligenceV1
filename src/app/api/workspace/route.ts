import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getWorkspace } from "@/lib/campaigns/workspace-store";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const workspace = await getWorkspace(user.id, id);
    if (!workspace) return NextResponse.json({ error: "Workspace not found", id }, { status: 404 });
    const currentVersion = workspace.versions.find((v) => v.id === workspace.currentVersionId);
    return NextResponse.json({
      ...workspace,
      outputs: currentVersion?.outputs ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get workspace";
    if (msg === "Not authenticated") return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
