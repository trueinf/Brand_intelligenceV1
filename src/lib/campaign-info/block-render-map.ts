/**
 * Block render map: which CampaignInfoOutput blocks to show per objective.
 * Used by poster composer to render blocks conditionally.
 */

import type { CampaignObjective } from "./campaign-info.types";

export type BlockRenderConfig = {
  showKicker: boolean;
  showHeadline: boolean;
  showSubHeadline: boolean;
  showProductLine: boolean;
  showExperienceLine: boolean;
  showEventDetails: boolean;
  showAvailabilityLine: boolean;
  showOfferLine: boolean;
  showCta: boolean;
};

const DEFAULT_CONFIG: BlockRenderConfig = {
  showKicker: true,
  showHeadline: true,
  showSubHeadline: true,
  showProductLine: true,
  showExperienceLine: true,
  showEventDetails: false,
  showAvailabilityLine: false,
  showOfferLine: false,
  showCta: true,
};

/**
 * Event → show eventDetails
 * ProductLaunch → show availabilityLine
 * SeasonalPromo → show offerLine
 * Retail / BrandAwareness → use defaults (headline, sub, CTA; offer/experience as relevant).
 */
export function getBlockRenderConfig(objective: CampaignObjective): BlockRenderConfig {
  const base = { ...DEFAULT_CONFIG };
  switch (objective) {
    case "event":
      return { ...base, showEventDetails: true, showProductLine: false };
    case "productLaunch":
      return { ...base, showAvailabilityLine: true, showProductLine: true };
    case "seasonalPromo":
      return { ...base, showOfferLine: true };
    case "retail":
      return { ...base, showOfferLine: true };
    case "brandAwareness":
      return { ...base, showExperienceLine: true, showOfferLine: false };
    default:
      return base;
  }
}
