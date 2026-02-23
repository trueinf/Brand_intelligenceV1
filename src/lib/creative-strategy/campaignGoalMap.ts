/**
 * Campaign Goal → Visual Strategy mapping.
 * Translates campaign_goal into a structured visual strategy for the Creative Brain.
 * Uses keyword detection; fallback = brand awareness lifestyle.
 */

export type VisualStrategy = {
  funnel_stage: string;
  creative_type: string;
  product_role: string;
  lifestyle_ratio: number;
  composition: string;
  camera_style: string;
  lighting_style: string;
  emotion: string;
  background_type: string;
  copy_space_priority: string;
  typography_style: string;
};

type GoalMatcher = {
  keywords: string[];
  strategy: VisualStrategy;
};

const PRODUCT_LAUNCH: VisualStrategy = {
  funnel_stage: "consideration",
  creative_type: "product-hero + lifestyle hybrid",
  product_role: "hero",
  lifestyle_ratio: 0.3,
  composition: "center-weighted hero",
  camera_style: "slightly low angle, 85mm",
  lighting_style: "dramatic spotlight + rim light",
  emotion: "desire / premium",
  background_type: "luxury minimal",
  copy_space_priority: "top",
  typography_style: "elegant serif headline",
};

const BRAND_AWARENESS: VisualStrategy = {
  funnel_stage: "awareness",
  creative_type: "lifestyle editorial",
  product_role: "supporting",
  lifestyle_ratio: 0.8,
  composition: "rule of thirds",
  camera_style: "cinematic wide",
  lighting_style: "natural / golden hour",
  emotion: "belonging / aspiration",
  background_type: "real environment",
  copy_space_priority: "center minimal",
  typography_style: "light elegant",
};

const PERFORMANCE_CONVERSION: VisualStrategy = {
  funnel_stage: "conversion",
  creative_type: "high-contrast product ad",
  product_role: "dominant",
  lifestyle_ratio: 0.2,
  composition: "product close-up",
  camera_style: "front hero angle",
  lighting_style: "bright high contrast",
  emotion: "urgency",
  background_type: "gradient / clean",
  copy_space_priority: "large headline + offer badge",
  typography_style: "bold sans-serif",
};

const EVENT_CAMPAIGN: VisualStrategy = {
  funnel_stage: "engagement",
  creative_type: "experience scene",
  product_role: "integrated",
  lifestyle_ratio: 0.7,
  composition: "social interaction focus",
  camera_style: "eye-level documentary",
  lighting_style: "warm ambient",
  emotion: "exclusivity / celebration",
  background_type: "venue-based",
  copy_space_priority: "top + bottom for event details",
  typography_style: "editorial luxury",
};

const RETAIL_POS: VisualStrategy = {
  funnel_stage: "conversion",
  creative_type: "packshot retail display",
  product_role: "hero",
  lifestyle_ratio: 0.1,
  composition: "center product with shadow",
  camera_style: "straight-on",
  lighting_style: "clean studio",
  emotion: "clarity / trust",
  background_type: "store / minimal",
  copy_space_priority: "price + CTA zone",
  typography_style: "bold clean",
};

/** Fallback when no keyword match (quality guard). */
const FALLBACK_STRATEGY: VisualStrategy = { ...BRAND_AWARENESS };

const MATCHERS: GoalMatcher[] = [
  {
    keywords: ["launch", "introducing", "new", "release", "debut"],
    strategy: PRODUCT_LAUNCH,
  },
  {
    keywords: ["awareness", "positioning", "story", "lifestyle"],
    strategy: BRAND_AWARENESS,
  },
  {
    keywords: ["sale", "offer", "discount", "limited time", "shop"],
    strategy: PERFORMANCE_CONVERSION,
  },
  {
    keywords: ["event", "evening", "tasting", "experience", "join us"],
    strategy: EVENT_CAMPAIGN,
  },
  {
    keywords: ["in-store", "retail", "available now", "find near you"],
    strategy: RETAIL_POS,
  },
];

function normalizeGoal(goal: string): string {
  return (goal ?? "").toLowerCase().trim();
}

function goalMatchesKeywords(normalizedGoal: string, keywords: string[]): boolean {
  return keywords.some((kw) => normalizedGoal.includes(kw));
}

/**
 * Maps campaign_goal to a structured visual strategy using keyword detection.
 * Order of matchers matters: first match wins. No match → fallback to brand awareness lifestyle.
 */
export function getVisualStrategyFromCampaignGoal(goal: string): VisualStrategy {
  const normalized = normalizeGoal(goal);
  if (!normalized) return FALLBACK_STRATEGY;

  for (const { keywords, strategy } of MATCHERS) {
    if (goalMatchesKeywords(normalized, keywords)) return { ...strategy };
  }

  return FALLBACK_STRATEGY;
}
