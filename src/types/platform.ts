/**
 * Platform types for AI Brand Intelligence.
 * Used by Prisma JSON fields and API payloads.
 */

// ---------- Brand Intelligence (dashboard) ----------

export interface BrandIntelligence {
  brandOverview: { name: string; domain: string; summary: string; industry?: string };
  brandContext?: { name: string; domain: string; industry?: string; description?: string } | null;
  campaigns: CampaignSummary[];
  insights: StrategyInsights;
  trafficTrend?: { date?: string; value?: number; organic?: number; paid?: number }[];
  channelMix?: { organic: number; paid: number; social: number; direct: number };
}

export interface CampaignSummary {
  campaign_name: string;
  campaign_type: string;
  objective: string;
  main_keyword: string;
  cpc: number;
  traffic_share: number;
  landing_page: string;
  duration?: string;
  success_score?: number;
}

// ---------- Keyword Intelligence ----------

export interface KeywordIntelligence {
  coreKeywords: string[];
  intentClusters: IntentCluster[];
  contentOpportunities: ContentOpportunity[];
  keywordGaps: KeywordGap[];
}

export interface IntentCluster {
  intent: string;
  keywords: string[];
  volume?: number;
}

export interface ContentOpportunity {
  topic: string;
  keywords: string[];
  priority: "high" | "medium" | "low";
  rationale?: string;
}

export interface KeywordGap {
  keyword: string;
  competitor?: string;
  opportunity: string;
}

// ---------- Strategy Insights ----------

export interface StrategyInsights {
  growth_score: number;
  paid_vs_organic_strategy: string;
  market_position: "leader" | "challenger" | "niche";
  top_competitors: string[];
  top_country: string;
  strategic_summary: string;
  marketing_maturity_level?: "starter" | "growth" | "performance_leader";
  channel_strategy_summary?: string;
  geo_opportunities?: string[];
  content_strategy_focus?: string;
}

// ---------- Brand Perception ----------

export interface BrandPerception {
  brandPersonality: string[];
  brandPosition: string;
  brandStrengthScore: number;
  emotionalTriggers: string[];
}

// ---------- Campaign Creative (image generator) ----------

export interface CampaignCreativeInput {
  brandId?: string;
  brandName: string;
  campaignGoal: string;
  channel: string;
  audience?: string;
  tone?: string;
  keyMessage?: string;
  visualStyle?: string;
}

export interface CampaignCreativeResult {
  imageUrl: string;
  prompt: string;
  inputParams: CampaignCreativeInput;
}

// ---------- Video (align with existing VideoScript) ----------

export interface VideoScript {
  title: string;
  scenes: VideoScriptScene[];
}

export interface VideoScriptScene {
  heading: string;
  text: string;
  visual_hint: string;
}

// ---------- Job status (async jobs) ----------

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface CampaignJobImage {
  url: string;
  prompt?: string;
}

export interface CampaignJobResult {
  images?: CampaignJobImage[];
  videoUrl?: string;
  imageUrl?: string;
}

export type CampaignJobType = "image" | "video";

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  jobType?: CampaignJobType;
  currentStep?: string;
  progress?: number;
  result?: CampaignJobResult;
  error?: string;
  createdAt?: number;
  campaignName?: string;
  brandName?: string;
  workspaceId?: string;
}
