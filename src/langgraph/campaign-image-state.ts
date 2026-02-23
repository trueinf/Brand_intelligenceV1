/**
 * State for Campaign Image Generation graph (Graph 3).
 */

import { Annotation } from "@langchain/langgraph";
import type { CampaignCreativeInput } from "@/types/platform";

export const CampaignImageStateAnnotation = Annotation.Root({
  input: Annotation<CampaignCreativeInput>(),
  brandRules: Annotation<string>(),
  masterPrompt: Annotation<string>(),
  imageUrl: Annotation<string | null>(),
  storedUrl: Annotation<string | null>(),
  error: Annotation<string | null>(),
});

export type CampaignImageState = typeof CampaignImageStateAnnotation.State;
export type CampaignImageUpdate = typeof CampaignImageStateAnnotation.Update;
