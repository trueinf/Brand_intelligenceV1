/**
 * Template-based video prompt from CampaignBrain. No LLM calls.
 */

import type { CampaignBrain } from "@/types/campaign";

export function buildVideoPrompt(brain: CampaignBrain): string {
  return `
Cinematic high-energy advertisement.

Target audience: ${brain.audience}
Core message: ${brain.valueProposition}

Opening hook: ${brain.hook}

Scene sequence:
${brain.scenes.map((s, i) => `Scene ${i + 1}: ${s}`).join("\n")}

Visual style: ${brain.visualStyle}

End frame with bold text: ${brain.cta}
`.trim();
}
