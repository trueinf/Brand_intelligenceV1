/**
 * Load Brand Kit for use in poster composer, video generator, campaign image generator.
 * Re-exports getBrandKit so callers use one entry point.
 */

export { getBrandKit } from "./brand-kit.service";
export type { BrandKit } from "./brand-kit.types";
export { getDefaultBrandKit, DEFAULT_BRAND_KITS } from "./default-kits";
