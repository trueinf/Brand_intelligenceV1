/**
 * Campaign Information Composer — structured, marketing-ready information blocks.
 */

export type CampaignObjective =
  | "event"
  | "productLaunch"
  | "seasonalPromo"
  | "retail"
  | "brandAwareness";

export type CampaignInfoInput = {
  brandName: string;
  campaignObjective: CampaignObjective;
  productName?: string;
  offer?: string;
  location?: string;
  date?: string;
  time?: string;
  valueProposition: string;
  targetAudience: string;
  brandTone: string;
};

export type CampaignInfoOutput = {
  kicker?: string;
  headline: string;
  subHeadline?: string;
  productLine?: string;
  experienceLine?: string;
  eventDetails?: string;
  availabilityLine?: string;
  offerLine?: string;
  cta: string;
};
