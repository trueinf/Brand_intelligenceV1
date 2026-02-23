/**
 * State for Brand Intelligence graph (Graph 1).
 * Returns unified dashboard JSON.
 */

import { Annotation } from "@langchain/langgraph";
import type { BrandIntelligence, KeywordIntelligence, StrategyInsights } from "@/types/platform";

export const BrandIntelligenceStateAnnotation = Annotation.Root({
  input: Annotation<string>(),
  brandName: Annotation<string>(),
  domain: Annotation<string>(),
  industry: Annotation<string | null>(),
  // data_collection (mock)
  rawData: Annotation<{ websiteContent?: string; campaignMessaging: string[] } | null>(),
  // keyword_extraction
  keywordIntelligence: Annotation<KeywordIntelligence | null>(),
  // campaign_detection (from mock/synthetic)
  campaigns: Annotation<BrandIntelligence["campaigns"]>(),
  // brand_perception
  brandPerception: Annotation<{
    brandPersonality: string[];
    brandPosition: string;
    brandStrengthScore: number;
    emotionalTriggers: string[];
  } | null>(),
  // strategy_insight
  strategyInsights: Annotation<StrategyInsights | null>(),
  // output
  dashboardJson: Annotation<BrandIntelligence | null>(),
  error: Annotation<string | null>(),
});

export type BrandIntelligenceState = typeof BrandIntelligenceStateAnnotation.State;
export type BrandIntelligenceUpdate = typeof BrandIntelligenceStateAnnotation.Update;
