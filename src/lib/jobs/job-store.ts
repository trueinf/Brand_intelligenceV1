/**
 * In-memory job status store for async jobs (e.g. video render).
 * Replace with DB/Redis later.
 */

import type { JobStatusResponse } from "@/types/platform";

const jobStore = new Map<string, JobStatusResponse>();

export function setJobStatus(jobId: string, data: Partial<JobStatusResponse>): void {
  const existing = jobStore.get(jobId) ?? { jobId, status: "pending" };
  jobStore.set(jobId, { ...existing, ...data });
}

export function getJobStatus(jobId: string): JobStatusResponse | null {
  return jobStore.get(jobId) ?? null;
}
