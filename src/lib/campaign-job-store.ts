/**
 * Campaign generation job store (Upstash Redis).
 * Key: campaign:{jobId} -> { status, input, mode, output?, error?, createdAt }
 */

import { getRedis } from "@/lib/redis";
import type { CampaignGenerationInput, CampaignGenerationMode } from "@/langgraph/campaign-generation-state";
import type { CampaignOutput, CampaignJobProgress } from "@/types/campaign";

const KEY_PREFIX = "campaign:";
const TTL_SECONDS = 60 * 60; // 1 hour for completed/failed

export type CampaignJobStatus = "queued" | "running" | "completed" | "failed";

export interface CampaignJob {
  status: CampaignJobStatus;
  input: CampaignGenerationInput;
  /** Present for new jobs; legacy jobs may lack it (worker defaults to "video"). */
  mode?: CampaignGenerationMode;
  output?: CampaignOutput;
  error?: string;
  createdAt: number;
  progress?: CampaignJobProgress;
}

function jobKey(jobId: string): string {
  return `${KEY_PREFIX}${jobId}`;
}

export function generateCampaignJobId(): string {
  return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Create a job with status "queued". Returns jobId. */
export async function createCampaignJob(
  input: CampaignGenerationInput,
  mode: CampaignGenerationMode
): Promise<string> {
  const redis = getRedis();
  const jobId = generateCampaignJobId();
  const job: CampaignJob = {
    status: "queued",
    input,
    mode,
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

/** Update only job progress (overall + optional image/video) for live UI. */
export async function updateCampaignJobProgress(
  jobId: string,
  progress: CampaignJobProgress
): Promise<void> {
  const redis = getRedis();
  const key = jobKey(jobId);
  const existing = await redis.get<CampaignJob>(key);
  if (!existing) return;
  await redis.set(key, { ...existing, progress });
}

/** Update a single asset's progress and recompute overall percent. */
export async function updateAssetProgress(
  jobId: string,
  asset: "image" | "video",
  percent: number,
  step: string
): Promise<void> {
  const redis = getRedis();
  const key = jobKey(jobId);
  const existing = await redis.get<CampaignJob>(key);
  if (!existing) return;

  const progress: CampaignJobProgress = existing.progress ?? {
    overallPercent: 0,
    step: "Starting",
  };

  progress[asset] = { percent, step };
  progress.step = step;

  const imagePercent = progress.image?.percent ?? 0;
  const videoPercent = progress.video?.percent ?? 0;
  const divisor = progress.image != null && progress.video != null ? 2 : 1;
  progress.overallPercent = Math.round((imagePercent + videoPercent) / divisor);

  await redis.set(key, { ...existing, progress });
}
