/**
 * Brand Kit — design system applied to campaign creatives.
 */

export type BrandKit = {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontHeadline: string;
  fontBody: string;
  buttonStyle: "solid" | "outline" | "ghost";
  tone: "luxury" | "modern" | "playful" | "corporate";
  visualStyle: string;
};
