/**
 * Campaign Creative Brain — creative direction from campaign inputs.
 */

export { generateCreativeDirection } from "./creative-brain.service";
export { buildCreativeBrainPrompt, CREATIVE_BRAIN_SYSTEM } from "./creative-brain.prompt";
export type { CreativeBrainInput, CreativeBrainOutput } from "@/types/campaign-creative-brain";
