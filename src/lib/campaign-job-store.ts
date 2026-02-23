/**
 * Campaign generation job store (Upstash Redis).
 * Key: campaign:{jobId} -> { status, input, output?, error?, createdAt }
 */

import { getRedis } from "@/lib/redis";
import type { CampaignGenerationInput } from "@/langgraph/campaign-generation-state";
import type { CampaignOutput } from "@/types/campaign";

const KEY_PREFIX = "campaign:";
const TTL_SECONDS = 60 * 60; // 1 hour for completed/failed

export type CampaignJobStatus = "queued" | "running" | "completed" | "failed";

export interface CampaignJob {
  status: CampaignJobStatus;
  input: CampaignGenerationInput;
  output?: CampaignOutput;
  error?: string;
  createdAt: number;
}

function jobKey(jobId: string): string {
  return `${KEY_PREFIX}${jobId}`;
}

export function generateCampaignJobId(): string {
  return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Create a job with status "queued". Returns jobId. */
export async function createCampaignJob(input: CampaignGenerationInput): Promise<string> {
  const redis = getRedis();
  const jobId = generateCampaignJobId();
  const job: CampaignJob = {
    status: "queued",
    input,
    createdAt: Date.now(),
  };
  await redis.set(jobKey(jobId), job);
  return jobId;
}

/** Get job by id. Returns null if not found. */
export async function getCampaignJob(jobId: string): Promise<CampaignJob | null> {
  const redis = getRedis();
  return redis.get<CampaignJob>(jobKey(jobId));
}

/** Update job (partial merge). Sets TTL when status is completed or failed. */
export async function updateCampaignJob(
  jobId: string,
  updates: Partial<Pick<CampaignJob, "status" | "output" | "error">>
): Promise<void> {
  const redis = getRedis();
  const key = jobKey(jobId);
  const existing = await redis.get<CampaignJob>(key);
  if (!existing) return;
  const updated: CampaignJob = { ...existing, ...updates };
  await redis.set(key, updated);
  if (updated.status === "completed" || updated.status === "failed") {
    await redis.expire(key, TTL_SECONDS);
  }
}
