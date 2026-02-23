/**
 * Shared types for Brand Campaign Intelligence.
 * All data flows from LangGraph; no hardcoded UI data.
 */

// ---------- Brand (workflow state) ----------

export interface Brand {
  brand_name: string;
  domain: string;
}

// ---------- Brand context (Clearbit enrichment) ----------

export interface BrandContext {
  name: string;
  logo?: string;
  domain: string;
  industry?: string;
  category?: string;
  employees?: number;
  employeesRange?: string;
  location?: string;
  country?: string;
  description?: string;
}

// ---------- Synthetic data (OpenAI-generated from brand context) ----------

export interface SyntheticDomainOverview {
  authority_score: number;
  organic_traffic: number;
  paid_traffic: number;
  backlink_count: number;
  top_country: string;
}

export interface ChannelMix {
  organic: number;
  paid: number;
  social: number;
  direct: number;
}

export type PaidKeywordIntent = "transactional" | "branded" | "competitor";

export interface SyntheticPaidKeyword {
  keyword: string;
  volume?: number;
  cpc: number;
  traffic_share: number;
  intent?: PaidKeywordIntent;
}

export interface SyntheticOrganicKeyword {
  keyword: string;
  volume?: number;
  position: number;
  traffic_share: number;
}

export interface SyntheticCompetitor {
  domain: string;
  traffic?: number;
  overlap: number;
  overlap_score?: number;
  category?: string;
}

export interface TrafficTrendPoint {
  date?: string;
  month?: string;
  traffic?: number;
  value?: number;
  organic?: number;
  paid?: number;
  total?: number;
}

export type CampaignTimelineChannel = "paid" | "organic" | "social";
export type CampaignImpactLevel = "low" | "medium" | "high";

export interface CampaignTimelineEvent {
  campaign_name: string;
  channel?: CampaignTimelineChannel;
  goal?: string;
  duration?: string;
  impact_level?: CampaignImpactLevel;
  period?: string;
  focus?: string;
  outcome?: string;
}

export interface SyntheticData {
  domain_overview: SyntheticDomainOverview;
  channel_mix: ChannelMix;
  paid_keywords: SyntheticPaidKeyword[];
  organic_keywords: SyntheticOrganicKeyword[];
  competitors: SyntheticCompetitor[];
  traffic_trend: TrafficTrendPoint[];
  campaign_timeline: CampaignTimelineEvent[];
}

// ---------- YouTube creatives (SerpAPI) ----------

export interface YouTubeCreative {
  title: string;
  thumbnail: string;
  views: number | string;
  link: string;
}

// ---------- Legacy / compatibility (mock_data from Phase 1) ----------

export interface DomainOverview {
  domain: string;
  globalRank: number;
  countryRank: number;
  organicTraffic: number;
  organicKeywords: number;
  paidTraffic: number;
  paidKeywords: number;
  trafficCost: number;
  keywordsDifficulty: number;
  lastUpdated: string;
}

export interface PaidKeyword {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  position: number;
  url?: string;
}

export interface AdCopy {
  title: string;
  description: string;
  displayUrl: string;
  visibleUrl: string;
  position: number;
}

export interface PaidLandingPage {
  url: string;
  traffic: number;
  keywords: number;
  conversions?: number;
}

export interface OrganicKeyword {
  keyword: string;
  volume: number;
  position: number;
  url: string;
  trafficShare: number;
}

export interface Competitor {
  domain: string;
  commonKeywords: number;
  organicTraffic: number;
  paidTraffic: number;
  overlap: number;
}

export interface MockSemrushData {
  domain_overview: DomainOverview;
  paid_keywords: PaidKeyword[];
  ad_copies: AdCopy[];
  paid_landing_pages: PaidLandingPage[];
  organic_keywords: OrganicKeyword[];
  competitors: Competitor[];
  traffic_trend: TrafficTrendPoint[];
}

// ---------- Campaign (LLM campaign_intelligence_node output) ----------

export type CampaignType = "product" | "brand" | "performance" | "offer";

export interface AdMessaging {
  headlines: string[];
  descriptions: string[];
}

export interface Campaign {
  campaign_name: string;
  campaign_type: CampaignType;
  objective: string;
  main_keyword: string;
  cpc: number;
  traffic_share: number;
  landing_page: string;
  ad_messaging: AdMessaging;
  duration: string;
  success_score: number;
}

// ---------- Insights (LLM insight_generation_node output) ----------

export type MarketPosition = "leader" | "challenger" | "niche";

export type MarketingMaturityLevel = "starter" | "growth" | "performance_leader";

export interface Insights {
  growth_score: number;
  paid_vs_organic_strategy: string;
  market_position: MarketPosition;
  top_competitors: string[];
  top_country: string;
  strategic_summary: string;
  marketing_maturity_level?: MarketingMaturityLevel;
  channel_strategy_summary?: string;
  geo_opportunities?: string[];
  content_strategy_focus?: string;
}

// ---------- Brand overview ----------

export interface BrandOverview {
  name: string;
  domain: string;
  summary: string;
  industry?: string;
}

// ---------- API response (Phase-2) ----------

export interface AnalyzeBrandResponse {
  brand_overview: BrandOverview;
  brand_context?: BrandContext | null;
  campaigns: Campaign[];
  insights: Insights;
  synthetic_data?: SyntheticData | null;
  youtube_creatives?: YouTubeCreative[];
  campaign_timeline?: CampaignTimelineEvent[];
  traffic_trend?: TrafficTrendPoint[];
}

// ---------- Video generation (strategy video) ----------

export interface VideoScene {
  title: string;
  narration: string;
  /** @deprecated use visual_description for new pipeline */
  visual_prompt?: string;
  /** Scene image description for OpenAI/Gemini image generation */
  visual_description?: string;
  duration: number;
}

export interface VideoStory {
  scenes: VideoScene[];
}

/** Normalize scene: use visual_description or fallback to visual_prompt */
export function sceneVisualDescription(scene: VideoScene): string {
  return scene.visual_description ?? scene.visual_prompt ?? "";
}

export interface GenerateVideoResponse {
  video_url: string;
  scene_urls?: string[];
}

// ---------- Video script (presentation / strategy video) ----------

export interface InVideoScriptScene {
  text: string;
  visual_hint: string;
}

export interface InVideoScript {
  title: string;
  scenes: InVideoScriptScene[];
}

export type {
  BrandIntelligence,
  KeywordIntelligence,
  StrategyInsights,
  BrandPerception,
  CampaignCreativeInput,
  CampaignCreativeResult,
  JobStatus,
  JobStatusResponse,
} from "./platform";
