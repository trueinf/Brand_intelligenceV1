/**
 * Server-safe logo preload and optional background brightness sampling.
 * Preload: fetch logo → buffer → data URL so OG render doesn't depend on external fetch.
 * Brightness: sample top-right region of background image to choose light vs dark logo.
 */

const PADDING = 48;
const LOGO_REGION_WIDTH_RATIO = 0.2;
const LOGO_REGION_HEIGHT_RATIO = 0.15;
const LUMINANCE_THRESHOLD = 0.5;

/**
 * Fetch image and return as data URL for reliable server-side rendering.
 * Failsafe: returns null on any error (caller skips logo).
 */
export async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = contentType.split(";")[0].trim() || "image/png";
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Sample average luminance of the top-right region of an image (where logo will sit).
 * Returns 0–1 (0 = dark, 1 = light). Uses sharp if available; otherwise returns 0 (use light logo).
 */
export async function sampleBackgroundBrightness(imageUrl: string): Promise<number> {
  try {
    const sharp = await import("sharp").then((m) => m.default).catch(() => null);
    if (!sharp) return 0;

    const res = await fetch(imageUrl, { cache: "no-store" });
    if (!res.ok) return 0;
    const buffer = Buffer.from(await res.arrayBuffer());

    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 1200;
    const h = meta.height ?? 630;
    const x = Math.floor(w * (1 - LOGO_REGION_WIDTH_RATIO));
    const y = 0;
    const cropW = Math.floor(w * LOGO_REGION_WIDTH_RATIO);
    const cropH = Math.floor(h * LOGO_REGION_HEIGHT_RATIO);

    const { data } = await sharp(buffer)
      .extract({ left: Math.max(0, x), top: y, width: cropW, height: cropH })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = data.length / (cropW * cropH);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i]! / 255;
      const g = data[i + 1]! / 255;
      const b = data[i + 2]! / 255;
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
      count++;
    }
    return count > 0 ? sum / count : 0;
  } catch {
    return 0;
  }
}

/**
 * Choose logo URL when both light and dark variants exist: use background brightness.
 * brightBackground → use dark logo; dark background → use light logo.
 */
export function chooseLogoVariantUrl(
  lightUrl: string | null | undefined,
  darkUrl: string | null | undefined,
  brightness: number
): string | null {
  if (brightness >= LUMINANCE_THRESHOLD) {
    return darkUrl && darkUrl.trim() ? darkUrl : lightUrl ?? null;
  }
  return lightUrl && lightUrl.trim() ? lightUrl : darkUrl ?? null;
}

export { PADDING };
