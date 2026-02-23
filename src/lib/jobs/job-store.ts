/**
 * Campaign job store backed by Upstash Redis (user-scoped).
 * Key format: campaign:job:{userId}:{jobId}
 * User index: user:campaigns:{userId} (list of jobIds, newest first).
 * Jobs persist across requests; final state has 1h TTL.
 */

import { getRedis } from "@/lib/redis";
import type { JobStatusResponse, CampaignJobType } from "@/types/platform";

const JOB_PREFIX = "campaign:job:";
const USER_CAMPAIGNS_PREFIX = "user:campaigns:";

const ONE_HOUR_SECONDS = 60 * 60;

function jobKey(userId: string, jobId: string): string {
  return `${JOB_PREFIX}${userId}:${jobId}`;
}

function userCampaignsKey(userId: string): string {
  return `${USER_CAMPAIGNS_PREFIX}${userId}`;
}

/** Create a new job for the user, persist to Redis, add to user index. */
export async function createJob(
  userId: string,
  meta?: {
    campaignName?: string;
    brandName?: string;
    workspaceId?: string;
    jobType?: CampaignJobType;
  }
): Promise<JobStatusResponse> {
  const redis = getRedis();
  const jobId = `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const job: JobStatusResponse = {
    jobId,
    status: "pending",
    progress: 0,
    currentStep: "starting",
    createdAt: Date.now(),
    ...(meta?.campaignName && { campaignName: meta.campaignName }),
    ...(meta?.brandName && { brandName: meta.brandName }),
    ...(meta?.workspaceId && { workspaceId: meta.workspaceId }),
    ...(meta?.jobType && { jobType: meta.jobType }),
  };
  const k = jobKey(userId, jobId);
  await redis.set(k, job);
  await redis.lpush(userCampaignsKey(userId), jobId);
  return job;
}

/** Update job by merging partial data. Result is deep-merged. TTL when status is completed/failed. */
export async function updateJob(
  userId: string,
  jobId: string,
  data: Partial<JobStatusResponse>
): Promise<void> {
  const redis = getRedis();
  const k = jobKey(userId, jobId);
  const existing = await redis.get<JobStatusResponse>(k);
  if (!existing) return;
  const mergedResult =
    existing.result && data.result
      ? { ...existing.result, ...data.result }
      : (data.result ?? existing.result);
  const updated: JobStatusResponse = {
    ...existing,
    ...data,
    ...(mergedResult !== undefined ? { result: mergedResult } : {}),
  };
  const isFinal = updated.status === "completed" || updated.status === "failed";
  if (isFinal) {
    await redis.set(k, updated, { ex: ONE_HOUR_SECONDS });
  } else {
    await redis.set(k, updated);
  }
}

/** Get job by user and job id. Returns null if not found or not owned by user. */
export async function getJob(
  userId: string,
  jobId: string
): Promise<JobStatusResponse | null> {
  return getRedis().get<JobStatusResponse>(jobKey(userId, jobId));
}

/** List job IDs for user (newest first). */
export async function listUserJobIds(userId: string): Promise<string[]> {
  const redis = getRedis();
  const key = userCampaignsKey(userId);
  const ids = await redis.lrange(key, 0, 99);
  return ids as string[];
}

/** Get all jobs for user, sorted by createdAt descending. */
export async function listUserJobs(
  userId: string
): Promise<JobStatusResponse[]> {
  const redis = getRedis();
  const jobIds = await listUserJobIds(userId);
  const jobs: JobStatusResponse[] = [];
  for (const id of jobIds) {
    const job = await redis.get<JobStatusResponse>(jobKey(userId, id));
    if (job) jobs.push(job);
  }
  jobs.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return jobs;
}
