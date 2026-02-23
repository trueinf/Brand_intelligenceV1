/**
 * POST /api/render-video
 * Body: { title: string, scenes: VideoScene[], audioUrl: string, brandName?: string }
 * When brandName is set, loads Brand Kit and passes to Remotion (colors, font, logo watermark).
 * Uses pre-bundled Remotion (run "npm run bundle-remotion" first). Renders MP4 to public/videos/, returns { videoUrl }.
 */

import { NextResponse } from "next/server";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { selectComposition, renderMedia } from "@remotion/renderer";
import type { VideoScene } from "@/types/video";
import { getBrandKit } from "@/lib/brand-kit/load-brand-kit";

const COMPOSITION_ID = "StrategyVideo";
const BUNDLE_DIR = ".remotion-bundle";
const VIDEOS_DIR = "public/videos";
const VIDEOS_PUBLIC_PATH = "/videos";

export const maxDuration = 300; // allow long-running render (e.g. Vercel)

function toAbsoluteUrl(pathOrUrl: string, origin: string): string {
  const s = pathOrUrl.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base = origin.replace(/\/$/, "");
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = body?.title as string | undefined;
    const scenes = body?.scenes as VideoScene[] | undefined;
    let audioUrl = body?.audioUrl as string | undefined;
    const brandName = typeof body?.brandName === "string" ? body.brandName : null;

    if (!title || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid title/scenes" },
        { status: 400 }
      );
    }

    const bundlePath = path.join(process.cwd(), BUNDLE_DIR);
    const { existsSync } = await import("node:fs");
    if (!existsSync(bundlePath)) {
      return NextResponse.json(
        {
          error:
            "Remotion bundle not found. Run: npm run bundle-remotion",
        },
        { status: 503 }
      );
    }

    const origin =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Headless browser needs an absolute URL for audio
    if (audioUrl && audioUrl.startsWith("/")) {
      audioUrl = `${origin}${audioUrl}`;
    }
    if (!audioUrl) audioUrl = "";

    let brandKit: { brandName: string; logoUrl: string; primaryColor: string; secondaryColor: string; fontHeadline: string; fontBody: string } | null = null;
    if (brandName) {
      const kit = await getBrandKit(brandName);
      brandKit = {
        brandName: kit.brandName,
        logoUrl: kit.logoUrl ? toAbsoluteUrl(kit.logoUrl, origin) : "",
        primaryColor: kit.primaryColor,
        secondaryColor: kit.secondaryColor,
        fontHeadline: kit.fontHeadline,
        fontBody: kit.fontBody,
      };
    }

    const inputProps = { title, scenes, audioUrl, brandKit };

    const composition = await selectComposition({
      serveUrl: bundlePath,
      id: COMPOSITION_ID,
      inputProps,
    });

    await mkdir(path.join(process.cwd(), VIDEOS_DIR), { recursive: true });
    const slug = `strategy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const outputPath = path.join(process.cwd(), VIDEOS_DIR, `${slug}.mp4`);

    await renderMedia({
      composition,
      serveUrl: bundlePath,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 25 === 0) {
          console.log(`Render progress: ${Math.round(progress * 100)}%`);
        }
      },
    });

    const videoUrl = `${VIDEOS_PUBLIC_PATH}/${slug}.mp4`;
    return NextResponse.json({ videoUrl });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Video render failed";
    console.error("Render error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
