/**
 * Types for AI Campaign Poster Composer.
 */

export type PosterCopy = {
  headline: string;
  subline: string;
  offer?: string;
  cta: string;
};

export type PosterLayout = {
  width: number;
  height: number;
  safePadding: number;
  logoPosition: "top" | "bottom";
  textAlignment: "left" | "center";
};

/** Logo URLs for poster: default and optional light/dark variants for contrast. */
export type PosterLogoUrls = {
  brandLogoUrl?: string | null;
  brandLogoLightUrl?: string | null;
  brandLogoDarkUrl?: string | null;
};
