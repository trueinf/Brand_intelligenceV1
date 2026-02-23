/**
 * Poster Composer — transform a campaign image into a platform-ready ad.
 * Places headline, subline, CTA, logo, and optional offer badge using layout_map from Creative Brain.
 * Server-side: sharp + SVG overlays. Cache by campaign_id + platform.
 */

import sharp from "sharp";
import { storeAsset } from "@/lib/storage/blob";
import type { PlacementPlan } from "@/lib/visual-hierarchy-engine";

// ---------------------------------------------------------------------------
// Types (input aligned with Creative Brain + spec)
// ---------------------------------------------------------------------------

/** Zone as descriptive position or normalized rect (0–1). */
export type ZoneSpec =
  | string
  | { x: number; y: number; width: number; height: number };

export type LayoutMap = {
  headline_zone: ZoneSpec;
  subline_zone: ZoneSpec;
  cta_zone: ZoneSpec;
  logo_zone: ZoneSpec;
  /** Optional; Creative Brain uses offer_badge_zone (alias supported). */
  offer_zone?: ZoneSpec;
  offer_badge_zone?: ZoneSpec;
  safe_margins?: string;
};

export type CampaignCopy = {
  headline: string;
  subline: string;
  cta: string;
  offer?: string;
};

export type BrandKit = {
  logo_url?: string;
  primary_color?: string;
  font_family?: string;
  font_style?: string;
  tone?: "luxury" | "performance" | "corporate" | string;
};

export type PosterPlatform =
  | "instagram"
  | "linkedin"
  | "poster"
  | "story"
  | "website";

export type ComposePosterInput = {
  image_url: string;
  layout_map: LayoutMap;
  campaign_copy: CampaignCopy;
  brand_kit: BrandKit;
  platform: PosterPlatform;
  /** Optional: for cache key and storage prefix */
  campaign_id?: string;
};

/** Pixel rect for placement. */
export type Rect = { x: number; y: number; width: number; height: number };

/** Layer metadata for preview and future video renderer. */
export type PreviewLayer = {
  type: "headline" | "subline" | "cta" | "logo" | "offer";
  bounds: Rect;
  text?: string;
  /** For CTA/offer: resolved color or style hint */
  style?: string;
};

export type ComposePosterOutput = {
  final_image_url: string;
  preview_layers: {
    headline?: PreviewLayer;
    subline?: PreviewLayer;
    cta?: PreviewLayer;
    logo?: PreviewLayer;
    offer?: PreviewLayer;
  };
};

// ---------------------------------------------------------------------------
// Creative Brain integration
// ---------------------------------------------------------------------------

/** Creative Brain output shape (copy_layout + platform_adaptation + brand_integration). */
export type CreativeBrainLayoutSource = {
  copy_layout?: {
    headline_zone?: string;
    subline_zone?: string;
    cta_zone?: string;
    offer_badge_zone?: string;
  };
  platform_adaptation?: { safe_margins?: string };
  brand_integration?: { logo_placement?: string };
};

/** Build layout_map from Creative Brain output for use with composePoster. */
export function layoutMapFromCreativeBrain(
  source: CreativeBrainLayoutSource
): LayoutMap {
  const copy = source.copy_layout;
  const platform = source.platform_adaptation;
  const brand = source.brand_integration;
  return {
    headline_zone: copy?.headline_zone?.trim() || "bottom-left",
    subline_zone: copy?.subline_zone?.trim() || "bottom-left",
    cta_zone: copy?.cta_zone?.trim() || "bottom",
    logo_zone: brand?.logo_placement?.trim() || "top-right",
    offer_badge_zone: copy?.offer_badge_zone?.trim(),
    safe_margins: platform?.safe_margins?.trim(),
  };
}

// ---------------------------------------------------------------------------
// Visual Hierarchy Engine integration
// ---------------------------------------------------------------------------

/** Build layout_map from Visual Hierarchy Engine placement plan. */
export function layoutMapFromVisualHierarchy(placement: PlacementPlan): LayoutMap {
  const headlineZone =
    placement.headline === "top"
      ? "top"
      : placement.headline === "top-left"
        ? "top-left"
        : placement.headline === "center"
          ? "center"
          : "bottom-left";
  const sublineZone = headlineZone;
  const ctaZone =
    placement.cta === "hidden" ? "bottom" : placement.cta === "floating" ? "bottom" : "bottom";
  const logoZone =
    placement.logo === "bottom-center"
      ? "bottom"
      : placement.logo === "bottom-left"
        ? "bottom-left"
        : "top-right";
  return {
    headline_zone: headlineZone,
    subline_zone: sublineZone,
    cta_zone: ctaZone,
    logo_zone: logoZone,
  };
}

// ---------------------------------------------------------------------------
// Platform dimensions and rules
// ---------------------------------------------------------------------------

const PLATFORM_SPECS: Record<
  PosterPlatform,
  { width: number; height: number; safeMarginPct: number; scaleText: number }
> = {
  instagram: { width: 1080, height: 1080, safeMarginPct: 6, scaleText: 1 },
  linkedin: { width: 1200, height: 627, safeMarginPct: 8, scaleText: 0.9 },
  poster: { width: 1080, height: 1350, safeMarginPct: 7, scaleText: 1 },
  story: { width: 1080, height: 1920, safeMarginPct: 10, scaleText: 1 },
  website: { width: 1200, height: 630, safeMarginPct: 5, scaleText: 1 },
};

// ---------------------------------------------------------------------------
// Zone resolution: string or normalized rect → pixel Rect
// ---------------------------------------------------------------------------

const ZONE_MAP: Record<string, { x: number; y: number; width: number; height: number }> = {
  "top-left": { x: 0.05, y: 0.08, width: 0.5, height: 0.2 },
  "top-right": { x: 0.5, y: 0.08, width: 0.45, height: 0.2 },
  "top": { x: 0.1, y: 0.08, width: 0.8, height: 0.18 },
  "center": { x: 0.1, y: 0.38, width: 0.8, height: 0.28 },
  "bottom-left": { x: 0.05, y: 0.7, width: 0.5, height: 0.22 },
  "bottom-right": { x: 0.5, y: 0.7, width: 0.45, height: 0.22 },
  "bottom": { x: 0.1, y: 0.72, width: 0.8, height: 0.2 },
  "left": { x: 0.05, y: 0.35, width: 0.45, height: 0.35 },
  "right": { x: 0.5, y: 0.35, width: 0.45, height: 0.35 },
};

function parseZone(zone: ZoneSpec, w: number, h: number, safe: number): Rect {
  const clamp = (v: number, maxVal: number) => Math.max(safe, Math.min(v, maxVal - safe));
  if (typeof zone === "string") {
    const key = zone.toLowerCase().replace(/\s+/g, "-");
    const r = ZONE_MAP[key] ?? ZONE_MAP["bottom-left"]!;
    const x = clamp(r.x * w, w);
    const y = clamp(r.y * h, h);
    const right = Math.min(w - safe, (r.x + r.width) * w);
    const bottom = Math.min(h - safe, (r.y + r.height) * h);
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(Math.max(0, right - x)),
      height: Math.round(Math.max(0, bottom - y)),
    };
  }
  const x = clamp(zone.x * w, w);
  const y = clamp(zone.y * h, h);
  const right = Math.min(w - safe, (zone.x + zone.width) * w);
  const bottom = Math.min(h - safe, (zone.y + zone.height) * h);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(Math.max(0, right - x)),
    height: Math.round(Math.max(0, bottom - y)),
  };
}

function parseSafeMargins(safe_margins: string | undefined, w: number, h: number): number {
  if (!safe_margins?.trim()) return 0;
  const m = safe_margins.trim();
  const pct = parseFloat(m.replace(/%/g, ""));
  if (!Number.isNaN(pct)) return Math.min(w, h) * (pct / 100);
  const px = parseFloat(m.replace(/px/i, ""));
  return Number.isNaN(px) ? 0 : px;
}

// ---------------------------------------------------------------------------
// Typography by tone
// ---------------------------------------------------------------------------

function getTypography(tone: string | undefined): {
  headlineFont: string;
  sublineFont: string;
  headlineWeight: string;
  sublineWeight: string;
  letterSpacing: string;
  lineHeight: number;
} {
  const t = (tone ?? "").toLowerCase();
  if (t === "luxury") {
    return {
      headlineFont: "Georgia, serif",
      sublineFont: "Georgia, serif",
      headlineWeight: "700",
      sublineWeight: "300",
      letterSpacing: "0.08em",
      lineHeight: 1.2,
    };
  }
  if (t === "performance") {
    return {
      headlineFont: "Arial, sans-serif",
      sublineFont: "Arial, sans-serif",
      headlineWeight: "800",
      sublineWeight: "600",
      letterSpacing: "0",
      lineHeight: 1.1,
    };
  }
  return {
    headlineFont: "Arial, Helvetica, sans-serif",
    sublineFont: "Arial, Helvetica, sans-serif",
    headlineWeight: "700",
    sublineWeight: "500",
    letterSpacing: "0.02em",
    lineHeight: 1.25,
  };
}

// ---------------------------------------------------------------------------
// Auto-contrast: sample luminance in region
// ---------------------------------------------------------------------------

async function sampleLuminance(
  imageBuffer: Buffer,
  rect: Rect,
  meta: { width: number; height: number; channels: number }
): Promise<number> {
  try {
    const { width, height } = meta;
    const x = Math.max(0, Math.min(rect.x, width - 1));
    const y = Math.max(0, Math.min(rect.y, height - 1));
    const w = Math.min(rect.width, width - x);
    const h = Math.min(rect.height, height - y);
    if (w <= 0 || h <= 0) return 0.5;

    const { data } = await sharp(imageBuffer)
      .extract({ left: x, top: y, width: w, height: h })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = meta.channels;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i]! / 255;
      const g = data[i + 1]! / 255;
      const b = data[i + 2]! / 255;
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
      count++;
    }
    return count > 0 ? sum / count : 0.5;
  } catch {
    return 0.5;
  }
}

/** Bright background → dark text; dark → white; else primary. */
function textColorForBackground(
  luminance: number,
  primaryColor: string
): string {
  if (luminance >= 0.6) return "#111111";
  if (luminance <= 0.35) return "#ffffff";
  return primaryColor || "#ffffff";
}

// ---------------------------------------------------------------------------
// SVG helpers (sharp can render SVG)
// ---------------------------------------------------------------------------

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapSvg(
  width: number,
  height: number,
  body: string,
  withShadow = false
): string {
  const filter = withShadow
    ? `<defs><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4"/></filter></defs>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${filter}<g${withShadow ? ' filter="url(#shadow)"' : ""}>${body}</g></svg>`;
}

/** Split headline into max 2 lines by word wrap. */
function wrapHeadline(text: string, maxCharsPerLine: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w.length <= maxCharsPerLine ? w : w.slice(0, maxCharsPerLine);
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Cache (in-memory by campaign_id + platform)
// ---------------------------------------------------------------------------

const composeCache = new Map<string, ComposePosterOutput>();

function cacheKey(campaign_id: string | undefined, platform: PosterPlatform): string | null {
  if (!campaign_id) return null;
  return `${campaign_id}:${platform}`;
}

// ---------------------------------------------------------------------------
// Main composer
// ---------------------------------------------------------------------------

/**
 * Compose a poster: load base image, apply safe margins, render headline, subline,
 * CTA, logo, optional offer badge with platform and tone rules; return final image URL and preview layers.
 */
export async function composePoster(
  input: ComposePosterInput
): Promise<ComposePosterOutput> {
  const key = cacheKey(input.campaign_id, input.platform);
  if (key) {
    const cached = composeCache.get(key);
    if (cached) return cached;
  }

  const spec = PLATFORM_SPECS[input.platform] ?? PLATFORM_SPECS.website;
  const [baseW, baseH] = [spec.width, spec.height];

  // 1) Load base image
  const imageRes = await fetch(input.image_url, { cache: "no-store" });
  if (!imageRes.ok) {
    throw new Error(`Failed to fetch image: ${imageRes.status} ${input.image_url}`);
  }
  let baseBuffer = Buffer.from(await imageRes.arrayBuffer());
  let meta = await sharp(baseBuffer).metadata();
  const origW = meta.width ?? baseW;
  const origH = meta.height ?? baseH;
  baseBuffer = await sharp(baseBuffer)
    .resize(baseW, baseH, { fit: "cover" })
    .toBuffer();
  meta = await sharp(baseBuffer).metadata();
  const w = meta.width ?? baseW;
  const h = meta.height ?? baseH;
  const channels = 4;

  const safe =
    parseSafeMargins(input.layout_map.safe_margins, w, h) ??
    Math.min(w, h) * (spec.safeMarginPct / 100);

  const headlineZone = parseZone(input.layout_map.headline_zone, w, h, safe);
  const sublineZone = parseZone(input.layout_map.subline_zone, w, h, safe);
  const ctaZone = parseZone(input.layout_map.cta_zone, w, h, safe);
  const logoZone = parseZone(input.layout_map.logo_zone, w, h, safe);
  const offerZoneSpec =
    input.layout_map.offer_zone ??
    input.layout_map.offer_badge_zone ??
    (input.campaign_copy.offer?.trim() ? "top-right" : undefined);
  const offerZone = offerZoneSpec
    ? parseZone(offerZoneSpec, w, h, safe)
    : null;

  const primary = input.brand_kit.primary_color ?? "#2563eb";
  const typo = getTypography(input.brand_kit.tone);
  const scale = spec.scaleText;

  // 2) Auto-contrast for headline area
  const headlineLuminance = await sampleLuminance(baseBuffer, headlineZone, {
    width: w,
    height: h,
    channels,
  });
  const headlineColor = textColorForBackground(headlineLuminance, primary);
  const sublineLuminance = await sampleLuminance(baseBuffer, sublineZone, {
    width: w,
    height: h,
    channels,
  });
  const sublineColor = textColorForBackground(sublineLuminance, primary);

  const fontFamily = input.brand_kit.font_family || typo.headlineFont;
  const maxHeadlineChars = Math.max(12, Math.floor(headlineZone.width / 28));
  const headlineLines = wrapHeadline(input.campaign_copy.headline, maxHeadlineChars);
  const headlineFontSize = Math.min(
    Math.floor((headlineZone.height / Math.max(headlineLines.length, 1)) * 0.75 * scale),
    72
  );
  const sublineFontSize = Math.min(
    Math.floor(headlineFontSize * 0.5 * scale),
    Math.floor(sublineZone.height * 0.6)
  );

  let composite = sharp(baseBuffer);
  const overlays: { input: Buffer; left: number; top: number }[] = [];
  const preview_layers: ComposePosterOutput["preview_layers"] = {};

  // 3) Headline
  if (headlineLines.length > 0) {
    const lineHeight = headlineFontSize * 1.15;
    const totalHeight = headlineLines.length * lineHeight;
    const startY = headlineZone.y + (headlineZone.height - totalHeight) / 2;
    const parts: string[] = [];
    headlineLines.forEach((line, i) => {
      parts.push(
        `<text x="${headlineZone.x + headlineZone.width / 2}" y="${Math.round(startY + (i + 1) * lineHeight)}" text-anchor="middle" dominant-baseline="middle" fill="${headlineColor}" font-family="${escapeXml(fontFamily)}" font-size="${headlineFontSize}" font-weight="${typo.headlineWeight}" letter-spacing="${typo.letterSpacing}">${escapeXml(line)}</text>`
      );
    });
    const svg = wrapSvg(w, h, parts.join(""), true);
    const headlineBuf = await sharp(Buffer.from(svg)).png().toBuffer();
    overlays.push({ input: headlineBuf, left: 0, top: 0 });
    preview_layers.headline = {
      type: "headline",
      bounds: headlineZone,
      text: input.campaign_copy.headline,
      style: headlineColor,
    };
  }

  // 4) Subline
  if (input.campaign_copy.subline && sublineZone.height > 0) {
    const sublineSvg = wrapSvg(
      w,
      h,
      `<text x="${sublineZone.x + sublineZone.width / 2}" y="${sublineZone.y + sublineZone.height / 2}" text-anchor="middle" dominant-baseline="middle" fill="${sublineColor}" font-family="${escapeXml(input.brand_kit.font_family || typo.sublineFont)}" font-size="${sublineFontSize}" font-weight="${typo.sublineWeight}">${escapeXml(input.campaign_copy.subline)}</text>`,
      true
    );
    const sublineBuf = await sharp(Buffer.from(sublineSvg)).png().toBuffer();
    overlays.push({ input: sublineBuf, left: 0, top: 0 });
    preview_layers.subline = {
      type: "subline",
      bounds: sublineZone,
      text: input.campaign_copy.subline,
      style: sublineColor,
    };
  }

  // 5) CTA button
  if (input.campaign_copy.cta && ctaZone.width > 0 && ctaZone.height > 0) {
    const pad = Math.min(20, ctaZone.width * 0.08, ctaZone.height * 0.2);
    const rx = Math.min(12, pad);
    const ctaSvg = wrapSvg(
      w,
      h,
      `<rect x="${ctaZone.x + pad}" y="${ctaZone.y + pad}" width="${ctaZone.width - 2 * pad}" height="${ctaZone.height - 2 * pad}" rx="${rx}" ry="${rx}" fill="${primary}"/><text x="${ctaZone.x + ctaZone.width / 2}" y="${ctaZone.y + ctaZone.height / 2}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="${escapeXml(fontFamily)}" font-size="${Math.min(Math.floor((ctaZone.height - 2 * pad) * 0.5), 28)}" font-weight="700">${escapeXml(input.campaign_copy.cta)}</text>`,
      true
    );
    const ctaBuf = await sharp(Buffer.from(ctaSvg)).png().toBuffer();
    overlays.push({ input: ctaBuf, left: 0, top: 0 });
    preview_layers.cta = {
      type: "cta",
      bounds: ctaZone,
      text: input.campaign_copy.cta,
      style: primary,
    };
  }

  // 6) Offer badge (optional)
  if (input.campaign_copy.offer?.trim() && offerZone) {
    const rad = Math.min(offerZone.width, offerZone.height) / 2;
    const cx = offerZone.x + offerZone.width / 2;
    const cy = offerZone.y + offerZone.height / 2;
    const offerSvg = wrapSvg(
      w,
      h,
      `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${primary}"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="${escapeXml(fontFamily)}" font-size="${Math.min(Math.floor(rad * 0.8), 48)}" font-weight="800">${escapeXml(input.campaign_copy.offer!.trim())}</text>`,
      true
    );
    const offerBuf = await sharp(Buffer.from(offerSvg)).png().toBuffer();
    overlays.push({ input: offerBuf, left: 0, top: 0 });
    preview_layers.offer = {
      type: "offer",
      bounds: offerZone,
      text: input.campaign_copy.offer,
      style: primary,
    };
  }

  // 7) Logo
  const logoUrl = input.brand_kit.logo_url;
  if (logoUrl?.trim() && logoZone.width > 0 && logoZone.height > 0) {
    try {
      const logoRes = await fetch(logoUrl, { cache: "no-store" });
      if (logoRes.ok) {
        const logoBuf = Buffer.from(await logoRes.arrayBuffer());
        const logoMeta = await sharp(logoBuf).metadata();
        const lw = logoMeta.width ?? 1;
        const lh = logoMeta.height ?? 1;
        const ratio = lw / lh;
        let targetW = logoZone.width;
        let targetH = logoZone.height;
        if (ratio > targetW / targetH) targetH = targetW / ratio;
        else targetW = targetH * ratio;
        const paddedW = Math.max(24, targetW - 16);
        const paddedH = Math.max(24, targetH - 16);
        const left = logoZone.x + (logoZone.width - paddedW) / 2;
        const top = logoZone.y + (logoZone.height - paddedH) / 2;
        const logoResized = await sharp(logoBuf)
          .resize(Math.round(paddedW), Math.round(paddedH), { fit: "contain" })
          .toBuffer();
        composite = composite.composite([{ input: logoResized, left: Math.round(left), top: Math.round(top) }]);
        preview_layers.logo = {
          type: "logo",
          bounds: { ...logoZone, x: Math.round(left), y: Math.round(top), width: Math.round(paddedW), height: Math.round(paddedH) },
        };
      }
    } catch {
      // skip logo on error
    }
  }

  // Composite text/CTA/offer overlays (full-size SVGs at 0,0)
  for (const ov of overlays) {
    composite = composite.composite([{ input: ov.input, left: ov.left, top: ov.top }]);
  }

  const finalBuffer = await composite.png().toBuffer();
  const prefix = input.campaign_id ? `poster-${input.campaign_id}` : "poster";
  const final_image_url = await storeAsset("image", finalBuffer, {
    prefix,
    extension: "png",
  });

  const result: ComposePosterOutput = {
    final_image_url,
    preview_layers,
  };

  if (key) composeCache.set(key, result);
  return result;
}
