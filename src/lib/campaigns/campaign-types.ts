import type { CampaignJobResult } from "@/types/platform";

export interface CampaignInputs {
  brandName: string;
  campaignGoal: string;
  channel: string;
  audience?: string;
  tone?: string;
  keyMessage?: string;
  visualStyle?: string;
  brandId?: string;
}

export interface CampaignVersion {
  id: string;
  jobId: string;
  outputs: CampaignJobResult;
  createdAt: number;
}

export interface CampaignWorkspace {
  id: string;
  userId: string;
  name: string;
  brandName: string;
  inputs: CampaignInputs;
  currentVersionId: string;
  versions: CampaignVersion[];
  createdAt: number;
  updatedAt: number;
}

export function generateWorkspaceId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function generateVersionId(): string {
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function workspaceDisplayName(brandName: string, campaignGoal: string): string {
  return [brandName, campaignGoal].filter(Boolean).join(" · ") || "Campaign";
}
