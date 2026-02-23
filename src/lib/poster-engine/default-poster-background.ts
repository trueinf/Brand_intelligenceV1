/**
 * Default poster background (gradient) when no image is provided.
 * Used by generate-poster-direct for a single-step poster flow.
 */

import sharp from "sharp";

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1350;

/** Dark gradient suitable for light text overlay (event-style poster). */
export async function createDefaultPosterBackground(
  width: number = DEFAULT_WIDTH,
  height: number = DEFAULT_HEIGHT
): Promise<Buffer> {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0f3460"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
</svg>`;
  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

export { DEFAULT_WIDTH as DEFAULT_POSTER_WIDTH, DEFAULT_HEIGHT as DEFAULT_POSTER_HEIGHT };
