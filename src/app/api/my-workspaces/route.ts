/**
 * GET /api/my-workspaces
 * Requires auth. Returns current user's campaign workspaces (name, brand, last updated, status).
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { listUserWorkspaces } from "@/lib/campaigns/workspace-store";

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request);
    const workspaces = await listUserWorkspaces(user.id);
    const list = workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      brandName: w.brandName,
      lastUpdated: w.updatedAt,
      status: w.versions.length > 0 ? "has_outputs" : "draft",
      versionCount: w.versions.length,
    }));
    return NextResponse.json(list);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list workspaces";
    if (msg === "Not authenticated") return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
