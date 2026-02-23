/**
 * Strongly typed dashboard data. Used by context and all dashboard components.
 */

export type DashboardStatus = "idle" | "loading" | "success" | "error" | "empty";

export type StrategyInsightPriority = "high" | "medium" | "low";

export interface StrategyInsightItem {
  text: string;
  priority?: StrategyInsightPriority;
}

export interface StrategyPanelData {
  whatsWorking: StrategyInsightItem[];
  whatsMissing: StrategyInsightItem[];
  recommendedActions: StrategyInsightItem[];
}

export interface BrandDNA {
  brandPersonality: string[];
  marketPosition: string;
  brandType: string;
}

export interface StrengthScore {
  score: number;
  subMetrics: { label: string; value: number; max?: number }[];
}

export interface GrowthDataPoint {
  month: string;
  value: number;
  label?: string;
}

export interface ChannelMixData {
  name: string;
  value: number;
  color?: string;
}

export interface DemandVsBrandBar {
  name: string;
  demand: number;
  brand: number;
}

export interface KeywordCluster {
  id: string;
  label: string;
  keywords: string[];
  volume?: number;
  intent?: string;
  opportunityScore?: number;
}

export interface ContentOpportunity {
  keyword: string;
  opportunity: "high" | "medium" | "low";
  rationale: string;
}

export interface CampaignTheme {
  id: string;
  campaignType: string;
  channel: string;
  goal: string;
  status: string;
  objective?: string;
  performance?: string;
  messaging?: string[];
}

export interface DashboardData {
  brandName: string;
  brandLogo?: string;
  dateRange: { from: string; to: string };
  brandDNA: BrandDNA;
  strengthScore: StrengthScore;
  growthChart: GrowthDataPoint[];
  growthYoY: number;
  channelMix: ChannelMixData[];
  demandVsBrand: DemandVsBrandBar[];
  keywordClusters: KeywordCluster[];
  contentOpportunity: ContentOpportunity | null;
  campaignThemes: CampaignTheme[];
  messagingStrategy: string;
  strategyPanel: StrategyPanelData;
}

export type VideoStepId = "analyzing" | "script" | "voiceover" | "rendering";

export interface VideoStep {
  id: VideoStepId;
  label: string;
  done: boolean;
  active: boolean;
}
