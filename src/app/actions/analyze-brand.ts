"use server";

import { executeWorkflow } from "@/lib/langgraph/workflow";
import type { AnalyzeBrandResponse } from "@/types";

export interface AnalyzeBrandResult {
  success: boolean;
  result?: AnalyzeBrandResponse;
  error?: string;
}

/**
 * Server action: runs LangGraph via executeWorkflow.
 * Frontend uses POST /api/analyze-brand; this action is for optional form/SSR use.
 */
export async function analyzeBrandAction(
  brandInput: string
): Promise<AnalyzeBrandResult> {
  const input = (brandInput || "").trim();
  if (!input) {
    return { success: false, error: "Please enter a brand name or domain." };
  }
  const outcome = await executeWorkflow(input);
  if (outcome.success) {
    return { success: true, result: outcome.data };
  }
  return { success: false, error: outcome.error };
}
