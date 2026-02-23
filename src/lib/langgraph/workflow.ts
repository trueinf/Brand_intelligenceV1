/**
 * Workflow entry point. Executes LangGraph and returns UI-ready JSON.
 */

import { runBrandCampaignWorkflow } from "@/langgraph/graph";
import type { AnalyzeBrandResponse } from "@/types";

export { runBrandCampaignWorkflow } from "@/langgraph/graph";

export async function executeWorkflow(
  brandInput: string
): Promise<{ success: true; data: AnalyzeBrandResponse } | { success: false; error: string }> {
  const state = await runBrandCampaignWorkflow(brandInput);
  if (state.error) {
    return { success: false, error: state.error };
  }
  if (!state.result) {
    return { success: false, error: "No result from workflow" };
  }
  return { success: true, data: state.result };
}
