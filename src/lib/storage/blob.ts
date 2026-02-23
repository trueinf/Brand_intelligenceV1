/**
 * Asset storage — generated images, videos, audio.
 * Local filesystem when writable; on Netlify (read-only fs) returns data URLs for images.
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

/** True when running in Netlify (or similar) where process.cwd()/public is not writable. */
function isReadOnlyFs(): boolean {
  return process.env.NETLIFY === "true";
}

/** Return a data URL for the buffer so it can be used without writing to disk. */
function toDataUrl(
  type: AssetType,
  buffer: Buffer,
  extension: string
): string {
  const ext = extension.replace(/^\./, "").toLowerCase();
  const mime =
    type === "image"
      ? ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : "image/png"
      : type === "audio"
        ? "audio/mpeg"
        : "video/mp4";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/**
 * Store a buffer to public/{creatives|videos|audio}/{prefix}-{slug}.{ext}.
 * Returns public URL path (e.g. /creatives/xxx.png).
 * On Netlify or when fs is read-only, returns a data URL for images so poster generation works.
 */
export async function storeAsset(
  type: AssetType,
  buffer: Buffer,
  options: { prefix?: string; extension: string }
): Promise<string> {
  if (isReadOnlyFs()) {
    return toDataUrl(type, buffer, options.extension);
  }

  const dir = path.join(process.cwd(), getSubdir(type));
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code === "ENOENT" || err?.code === "EACCES") {
      return toDataUrl(type, buffer, options.extension);
    }
    throw e;
  }
  const slug = `${options.prefix ?? "asset"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${slug}.${options.extension.replace(/^\./, "")}`;
  const filePath = path.join(dir, filename);
  try {
    await writeFile(filePath, buffer);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code === "ENOENT" || err?.code === "EACCES") {
      return toDataUrl(type, buffer, options.extension);
    }
    throw e;
  }

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
