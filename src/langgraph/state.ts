import { Annotation } from "@langchain/langgraph";
import type {
  Brand,
  BrandContext,
  MockSemrushData,
  SyntheticData,
  TrafficTrendPoint,
  Campaign,
  Insights,
  BrandOverview,
  AnalyzeBrandResponse,
  YouTubeCreative,
} from "@/types";

/**
 * Phase-2 state: brand_context (Clearbit), synthetic_data (OpenAI), youtube_creatives (SerpAPI).
 */
export const BrandCampaignStateAnnotation = Annotation.Root({
  input: Annotation<string>(),
  brand: Annotation<Brand | null>(),
  brand_context: Annotation<BrandContext | null>(),
  mock_data: Annotation<MockSemrushData | null>(),
  synthetic_data: Annotation<SyntheticData | null>(),
  traffic_trend: Annotation<TrafficTrendPoint[]>(),
  youtube_creatives: Annotation<YouTubeCreative[]>(),
  campaigns: Annotation<Campaign[]>(),
  insights: Annotation<Insights | null>(),
  brand_overview: Annotation<BrandOverview | null>(),
  result: Annotation<AnalyzeBrandResponse | null>(),
  error: Annotation<string | null>(),
});

export type BrandCampaignState = typeof BrandCampaignStateAnnotation.State;
export type BrandCampaignUpdate = typeof BrandCampaignStateAnnotation.Update;
