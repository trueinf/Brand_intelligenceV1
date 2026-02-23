/**
 * Keyword intelligence engine.
 * Input: scraped website content (mock for now) + campaign messaging.
 * Output: coreKeywords, intentClusters, contentOpportunities, keywordGaps.
 */

import type { KeywordIntelligence } from "@/types/platform";
import { generateKeywordClusters } from "@/lib/ai/openai";
import { getMockKeywordIntelligence } from "@/lib/data/mock-brand-data";

export interface KeywordEngineInput {
  websiteContent?: string;
  campaignMessaging: string[];
  useMock?: boolean;
}

export async function runKeywordEngine(
  input: KeywordEngineInput
): Promise<KeywordIntelligence> {
  if (input.useMock || !input.websiteContent) {
    return getMockKeywordIntelligence();
  }
  const snippet = input.websiteContent.slice(0, 4000);
  return generateKeywordClusters(snippet, input.campaignMessaging);
}
