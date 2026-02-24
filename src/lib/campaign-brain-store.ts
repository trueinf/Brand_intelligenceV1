/**
 * Store/retrieve precomputed CampaignBrain in Redis (e.g. from analyze-brand).
 * Key: campaign-brain:{brainId}, TTL 24 hours.
 */

import { getRedis } from "@/lib/redis";
import type { CampaignBrain } from "@/types/campaign";

const KEY_PREFIX = "campaign-brain:";
const TTL_SECONDS = 24 * 60 * 60; // 24 hours

function brainKey(brainId: string): string {
  return `${KEY_PREFIX}${brainId}`;
}

export function generateCampaignBrainId(): string {
  return `brain-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Store brain in Redis. Returns brainId. */
export async function storeCampaignBrain(brain: CampaignBrain): Promise<string> {
  const redis = getRedis();
  const brainId = generateCampaignBrainId();
  await redis.set(brainKey(brainId), brain, { ex: TTL_SECONDS });
  return brainId;
}

/** Load brain by id. Returns null if not found or expired. */
export async function getCampaignBrain(brainId: string): Promise<CampaignBrain | null> {
  const redis = getRedis();
  return redis.get<CampaignBrain>(brainKey(brainId));
}
