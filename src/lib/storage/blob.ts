/**
 * Asset storage — generated images, videos, audio.
 * Local filesystem for now (public/); replace with S3/R2 later without changing callers.
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const PUBLIC_ROOT = "public";

export type AssetType = "image" | "video" | "audio";

const SUBDIRS: Record<AssetType, string> = {
  image: "creatives",
  video: "videos",
  audio: "audio",
};

function getSubdir(type: AssetType): string {
  return path.join(PUBLIC_ROOT, SUBDIRS[type]);
}

/**
 * Store a buffer to public/{creatives|videos|audio}/{prefix}-{slug}.{ext}.
 * Returns public URL path (e.g. /creatives/xxx.png).
 */
export async function storeAsset(
  type: AssetType,
  buffer: Buffer,
  options: { prefix?: string; extension: string }
): Promise<string> {
  const dir = path.join(process.cwd(), getSubdir(type));
  await mkdir(dir, { recursive: true });
  const slug = `${options.prefix ?? "asset"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${slug}.${options.extension.replace(/^\./, "")}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);

  const subdir = SUBDIRS[type];
  return `/${subdir}/${filename}`;
}

/** Store from URL (e.g. OpenAI image URL) — fetch then store. */
export async function storeAssetFromUrl(
  type: AssetType,
  url: string,
  options: { prefix?: string; extension?: string }
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch asset: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = options.extension ?? (type === "image" ? "png" : type === "audio" ? "mp3" : "mp4");
  return storeAsset(type, buffer, { ...options, extension: ext });
}
