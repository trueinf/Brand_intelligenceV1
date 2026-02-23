/**
 * Brand Kit service: DB lookup by brand name, fallback to default kits.
 */

import { getPrisma } from "@/lib/db/prisma";
import type { BrandKit } from "./brand-kit.types";
import { getDefaultBrandKit } from "./default-kits";

function rowToBrandKit(row: {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontHeadline: string;
  fontBody: string;
  tone: string;
  accentColor: string | null;
  buttonStyle: string | null;
  visualStyle: string | null;
}): BrandKit {
  return {
    brandName: row.brandName,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    accentColor: row.accentColor ?? undefined,
    fontHeadline: row.fontHeadline,
    fontBody: row.fontBody,
    buttonStyle: (row.buttonStyle as BrandKit["buttonStyle"]) ?? "solid",
    tone: row.tone as BrandKit["tone"],
    visualStyle: row.visualStyle ?? "",
  };
}

/**
 * Get Brand Kit for a brand name.
 * 1) Try DB lookup (exact brandName match)
 * 2) Fallback to default kit (Nike, Apple, Robert Mondavi)
 * 3) Return a minimal fallback kit if nothing found
 */
export async function getBrandKit(brandName: string): Promise<BrandKit> {
  const name = brandName?.trim() || "";
  if (!name) return getFallbackKit("Brand");

  try {
    const row = await getPrisma().brandKit.findUnique({
      where: { brandName: name },
    });
    if (row) return rowToBrandKit(row);
  } catch {
    // DB not available or BrandKit table not migrated
  }

  const defaultKit = getDefaultBrandKit(name);
  if (defaultKit) return defaultKit;

  return getFallbackKit(name);
}

function getFallbackKit(brandName: string): BrandKit {
  return {
    brandName,
    logoUrl: "",
    primaryColor: "#111111",
    secondaryColor: "#ffffff",
    fontHeadline: "system-ui",
    fontBody: "system-ui",
    buttonStyle: "solid",
    tone: "modern",
    visualStyle: "Clean, professional",
  };
}
