/**
 * Supported image sizes for poster/campaign image API (e.g. DALL·E 3).
 * Default to portrait (1024x1536). Channel-aware size selection.
 */

export type PosterSize = "1024x1024" | "1024x1536" | "1536x1024" | "auto";

const ALLOWED_SIZES: PosterSize[] = ["1024x1024", "1024x1536", "1536x1024", "auto"];
const DEFAULT_SIZE: PosterSize = "1024x1536";

/**
 * Returns a supported poster size based on channel/platform.
 * - instagram / meta / tiktok / story → portrait 1024x1536
 * - linkedin / display / website → landscape 1536x1024
 * - unknown → default portrait 1024x1536
 */
export function getPosterSize(channel?: string): PosterSize {
  const c = (channel ?? "").toLowerCase().trim();
  if (["instagram", "meta", "tiktok", "story", "social"].includes(c)) {
    return "1024x1536";
  }
  if (["linkedin", "display", "website", "banner"].includes(c)) {
    return "1536x1024";
  }
  return DEFAULT_SIZE;
}

/**
 * Validates and normalizes size to an allowed value. Use before calling the image API.
 */
export function normalizePosterSize(size: string): PosterSize {
  const s = size.trim();
  if (ALLOWED_SIZES.includes(s as PosterSize)) {
    return s as PosterSize;
  }
  return DEFAULT_SIZE;
}
