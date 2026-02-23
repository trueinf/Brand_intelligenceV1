/**
 * Default Brand Kits — fallbacks when no DB record exists.
 */

import type { BrandKit } from "./brand-kit.types";

export const DEFAULT_BRAND_KITS: Record<string, BrandKit> = {
  Nike: {
    brandName: "Nike",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
    primaryColor: "#111111",
    secondaryColor: "#ffffff",
    accentColor: "#757575",
    fontHeadline: "Oswald",
    fontBody: "Roboto",
    buttonStyle: "solid",
    tone: "modern",
    visualStyle: "Bold, athletic, high contrast, motion-forward",
  },
  Apple: {
    brandName: "Apple",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    accentColor: "#86868b",
    fontHeadline: "SF Pro Display",
    fontBody: "SF Pro Text",
    buttonStyle: "outline",
    tone: "luxury",
    visualStyle: "Minimal, clean, premium, lots of white space",
  },
  "Robert Mondavi": {
    brandName: "Robert Mondavi",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Robert_Mondavi_Winery_logo.svg/200px-Robert_Mondavi_Winery_logo.svg.png",
    primaryColor: "#5c3317",
    secondaryColor: "#f5e6d3",
    accentColor: "#8b4513",
    fontHeadline: "Playfair Display",
    fontBody: "Lora",
    buttonStyle: "solid",
    tone: "luxury",
    visualStyle: "Wine country, warm earth tones, elegant serif",
  },
};

/** Normalize brand name for lookup (lowercase, trim). */
export function normalizeBrandName(name: string): string {
  return name.trim().toLowerCase();
}

/** Get default kit by name (case-insensitive match on brandName). */
export function getDefaultBrandKit(brandName: string): BrandKit | null {
  const key = Object.keys(DEFAULT_BRAND_KITS).find(
    (k) => normalizeBrandName(k) === normalizeBrandName(brandName)
  );
  return key ? DEFAULT_BRAND_KITS[key]! : null;
}
