/**
 * Campaign workspace store in Redis.
 * Keys: campaign:workspace:{userId}:{campaignId}, user:workspaces:{userId}
 */

import { getRedis } from "@/lib/redis";
import type { CampaignWorkspace, CampaignVersion } from "./campaign-types";
import { generateWorkspaceId, generateVersionId, workspaceDisplayName } from "./campaign-types";
import type { CampaignCreativeInput } from "@/types/platform";

const WORKSPACE_PREFIX = "campaign:workspace:";
const USER_WORKSPACES_PREFIX = "user:workspaces:";

function workspaceKey(userId: string, workspaceId: string): string {
  return `${WORKSPACE_PREFIX}${userId}:${workspaceId}`;
}

function userWorkspacesKey(userId: string): string {
  return `${USER_WORKSPACES_PREFIX}${userId}`;
}

function inputsFromBody(body: CampaignCreativeInput): CampaignWorkspace["inputs"] {
  return {
    brandName: body.brandName ?? "",
    campaignGoal: body.campaignGoal ?? "",
    channel: body.channel ?? "",
    audience: body.audience,
    tone: body.tone,
    keyMessage: body.keyMessage,
    visualStyle: body.visualStyle,
    brandId: body.brandId,
  };
}

/** Create a new workspace and add to user index. */
export async function createWorkspace(
  userId: string,
  inputs: CampaignCreativeInput,
  name?: string
): Promise<CampaignWorkspace> {
  const redis = getRedis();
  const id = generateWorkspaceId();
  const now = Date.now();
  const workspace: CampaignWorkspace = {
    id,
    userId,
    name: name ?? workspaceDisplayName(inputs.brandName, inputs.campaignGoal),
    brandName: inputs.brandName ?? "",
    inputs: inputsFromBody(inputs),
    currentVersionId: "",
    versions: [],
    createdAt: now,
    updatedAt: now,
  };
  await redis.set(workspaceKey(userId, id), workspace);
  await redis.lpush(userWorkspacesKey(userId), id);
  return workspace;
}

/** Get workspace by user and id. */
export async function getWorkspace(
  userId: string,
  workspaceId: string
): Promise<CampaignWorkspace | null> {
  return getRedis().get<CampaignWorkspace>(workspaceKey(userId, workspaceId));
}

/** Update workspace (partial merge). */
export async function updateWorkspace(
  userId: string,
  workspaceId: string,
  data: Partial<Pick<CampaignWorkspace, "name" | "inputs" | "currentVersionId" | "updatedAt">>
): Promise<void> {
  const redis = getRedis();
  const k = workspaceKey(userId, workspaceId);
  const existing = await redis.get<CampaignWorkspace>(k);
  if (!existing) return;
  const updated: CampaignWorkspace = {
    ...existing,
    ...data,
    updatedAt: data.updatedAt ?? Date.now(),
  };
  await redis.set(k, updated);
}

/** Append a new version and set as current. */
export async function appendVersion(
  userId: string,
  workspaceId: string,
  jobId: string,
  outputs: CampaignVersion["outputs"]
): Promise<void> {
  const redis = getRedis();
  const k = workspaceKey(userId, workspaceId);
  const existing = await redis.get<CampaignWorkspace>(k);
  if (!existing) return;
  const versionId = generateVersionId();
  const version: CampaignVersion = {
    id: versionId,
    jobId,
    outputs,
    createdAt: Date.now(),
  };
  const versions = [version, ...existing.versions];
  const updated: CampaignWorkspace = {
    ...existing,
    currentVersionId: versionId,
    versions,
    updatedAt: Date.now(),
  };
  await redis.set(k, updated);
}

/** List workspace IDs for user (newest first). */
export async function listUserWorkspaceIds(userId: string): Promise<string[]> {
  const redis = getRedis();
  const ids = await redis.lrange(userWorkspacesKey(userId), 0, 99);
  return ids as string[];
}

/** List workspaces for user with summary fields. */
export async function listUserWorkspaces(
  userId: string
): Promise<CampaignWorkspace[]> {
  const redis = getRedis();
  const ids = await listUserWorkspaceIds(userId);
  const workspaces: CampaignWorkspace[] = [];
  for (const id of ids) {
    const w = await redis.get<CampaignWorkspace>(workspaceKey(userId, id));
    if (w) workspaces.push(w);
  }
  workspaces.sort((a, b) => b.updatedAt - a.updatedAt);
  return workspaces;
}
