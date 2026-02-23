/**
 * Mock dashboard data for AI Brand Intelligence UI.
 * All dashboard components are bound to this data; no hardcoded values in components.
 * Types re-exported from @/types/dashboard for backward compatibility.
 */

import type {
  BrandDNA,
  StrengthScore,
  GrowthDataPoint,
  ChannelMixData,
  DemandVsBrandBar,
  KeywordCluster,
  ContentOpportunity,
  CampaignTheme,
  StrategyPanelData,
  DashboardData,
} from "@/types/dashboard";

export type {
  BrandDNA,
  StrengthScore,
  GrowthDataPoint,
  ChannelMixData,
  DemandVsBrandBar,
  KeywordCluster,
  ContentOpportunity,
  CampaignTheme,
  StrategyPanelData,
  DashboardData,
};

const BRAND_DNA: BrandDNA = {
  brandPersonality: ["Innovative", "Professional", "Trustworthy", "Data-driven"],
  marketPosition: "Challenger",
  brandType: "B2B SaaS",
};

const STRENGTH_SCORE: StrengthScore = {
  score: 78,
  subMetrics: [
    { label: "Awareness", value: 82, max: 100 },
    { label: "Consideration", value: 74, max: 100 },
    { label: "Conversion", value: 68, max: 100 },
  ],
};

const GROWTH_CHART: GrowthDataPoint[] = [
  { month: "Jul", value: 62 },
  { month: "Aug", value: 65 },
  { month: "Sep", value: 71 },
  { month: "Oct", value: 68 },
  { month: "Nov", value: 75 },
  { month: "Dec", value: 78 },
];

const CHANNEL_MIX: ChannelMixData[] = [
  { name: "Organic", value: 42, color: "#22c55e" },
  { name: "Paid", value: 35, color: "#3b82f6" },
  { name: "Social", value: 14, color: "#a855f7" },
  { name: "Direct", value: 9, color: "#f59e0b" },
];

const DEMAND_VS_BRAND: DemandVsBrandBar[] = [
  { name: "Q1", demand: 45, brand: 55 },
  { name: "Q2", demand: 52, brand: 48 },
  { name: "Q3", demand: 48, brand: 52 },
  { name: "Q4", demand: 41, brand: 59 },
];

const KEYWORD_CLUSTERS: KeywordCluster[] = [
  { id: "1", label: "Transactional", intent: "transactional", keywords: ["pricing", "demo", "buy", "trial"], volume: 12000, opportunityScore: 85 },
  { id: "2", label: "Informational", intent: "informational", keywords: ["how to", "guide", "best practices"], volume: 8000, opportunityScore: 62 },
  { id: "3", label: "Branded", intent: "branded", keywords: ["acme", "acme corp", "acme software"], volume: 5000, opportunityScore: 40 },
  { id: "4", label: "Competitor", intent: "competitor", keywords: ["alternative", "vs", "comparison"], volume: 3200, opportunityScore: 78 },
];

const CONTENT_OPPORTUNITY: ContentOpportunity = {
  keyword: "integration guide",
  opportunity: "high",
  rationale: "High search volume, low competition, strong intent. Recommended for pillar content.",
};

const CAMPAIGN_THEMES: CampaignTheme[] = [
  { id: "1", campaignType: "Brand", channel: "Paid Search", goal: "Awareness", status: "Active" },
  { id: "2", campaignType: "Performance", channel: "LinkedIn", goal: "Leads", status: "Active" },
  { id: "3", campaignType: "Product", channel: "Display", goal: "Consideration", status: "Paused" },
];

const STRATEGY_PANEL: StrategyPanelData = {
  whatsWorking: [
    { text: "Strong branded search share (59% in Q4).", priority: "high" },
    { text: "Organic traffic up 12% YoY.", priority: "medium" },
    { text: "LinkedIn performance above benchmark.", priority: "medium" },
  ],
  whatsMissing: [
    { text: "Low share in high-intent transactional keywords.", priority: "high" },
    { text: "Limited content for comparison and alternative queries.", priority: "medium" },
  ],
  recommendedActions: [
    { text: "Create comparison and alternative-to-competitor content.", priority: "high" },
    { text: "Increase budget on high-intent demand campaigns.", priority: "medium" },
    { text: "Launch retargeting for demo abandoners.", priority: "low" },
  ],
};

export function getMockDashboardData(brandName?: string): DashboardData {
  return {
    brandName: brandName ?? "Acme Corp",
    brandLogo: undefined,
    dateRange: { from: "2024-07-01", to: "2024-12-31" },
    brandDNA: BRAND_DNA,
    strengthScore: STRENGTH_SCORE,
    growthChart: GROWTH_CHART,
    growthYoY: 12.4,
    channelMix: CHANNEL_MIX,
    demandVsBrand: DEMAND_VS_BRAND,
    keywordClusters: KEYWORD_CLUSTERS,
    contentOpportunity: CONTENT_OPPORTUNITY,
    campaignThemes: CAMPAIGN_THEMES,
    messagingStrategy:
      "Focus on outcomes and ROI: 'Save 20% on operational costs' and 'Deploy in days, not months.' Use proof points and customer logos. Avoid feature-heavy copy; lead with business impact.",
    strategyPanel: STRATEGY_PANEL,
  };
}
