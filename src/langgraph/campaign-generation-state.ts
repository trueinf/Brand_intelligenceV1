/**
 * State for campaign generation graph.
 */

import { Annotation } from "@langchain/langgraph";
import type {
  CampaignBrief,
  CampaignCreativePrompts,
  GeneratedAdImage,
} from "@/types/campaign";

/** Inputs from dashboard (brand + keyword + strategy). */
export interface CampaignGenerationInput {
  brandName: string;
  campaignId?: string;
  /** When set, skip strategist + creative and use stored brain (video-fast). */
  campaignBrainId?: string;
  brandOverview?: { name: string; domain: string; summary?: string };
  keywordIntelligence?: {
    coreKeywords?: string[];
    intentClusters?: { intent: string; keywords: string[] }[];
    contentOpportunities?: { topic: string; priority: string }[];
  };
  strategyInsights?: {
    strategic_summary?: string;
    market_position?: string;
    growth_score?: number;
    channel_strategy_summary?: string;
  };
  campaignsSummary?: string;
  /** When set, strategist uses this as the campaign description (direct Asset Studio flow). */
  directPrompt?: string;
}

export type CampaignGenerationMode = "image" | "video" | "both" | "video-fast";

export const CampaignGenerationStateAnnotation = Annotation.Root({
  /** Set by worker for step logging (GENERATING IMAGES / GENERATING VIDEO). */
  jobId: Annotation<string | null>(),
  input: Annotation<CampaignGenerationInput>(),
  mode: Annotation<CampaignGenerationMode>(),
  campaignBrief: Annotation<CampaignBrief | null>(),
  creativePrompts: Annotation<CampaignCreativePrompts | null>(),
  adImages: Annotation<GeneratedAdImage[]>(),
  videoUrl: Annotation<string | null>(),
  error: Annotation<string | null>(),
});

export type CampaignGenerationState = typeof CampaignGenerationStateAnnotation.State;
export type CampaignGenerationUpdate = typeof CampaignGenerationStateAnnotation.Update;
