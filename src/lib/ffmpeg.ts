/**
 * Bundled cross-platform ffmpeg renderer. No system ffmpeg dependency.
 * Uses ffmpeg-static binary; path resolved from project root so it works in Next.js server bundle.
 * No spawnSync — uses async spawn only.
 */

import { spawn } from "node:child_process";
import { writeFile, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const FPS = 25;
const WIDTH = 1280;
const HEIGHT = 720;

function getFfmpegPath(): string {
  const path = require("node:path");
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  try {
    const pkgJson = require.resolve("ffmpeg-static/package.json");
    const pkgDir = path.dirname(pkgJson);
    return path.join(pkgDir, exe);
  } catch {
    return path.join(process.cwd(), "node_modules", "ffmpeg-static", exe);
  }
}

function execFfmpeg(args: string[], options?: { maxBuffer?: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = getFfmpegPath();
    const proc = spawn(bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const stderr: Buffer[] = [];
    proc.stderr?.on("data", (chunk) => stderr.push(chunk));
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${Buffer.concat(stderr).toString().slice(-500)}`));
    });
  });
}

export interface RenderScenesInput {
  /** Paths to scene images (PNG/JPEG), 16:9 recommended */
  imagePaths: string[];
  /** Paths to audio files (MP3/WAV) per scene */
  audioPaths: string[];
  /** Duration in seconds per scene (60–90s total recommended) */
  durations: number[];
  /** Optional title overlay per scene */
  titles?: string[];
}

/**
 * Renders scene images + audio into one MP4 with zoom, pan, fade transitions.
 * Writes result to outputPath. No spawnSync.
 */
export async function renderVideoFromScenes(
  input: RenderScenesInput,
  outputPath: string
): Promise<void> {
  const { imagePaths, audioPaths, durations, titles } = input;
  const n = Math.min(imagePaths.length, audioPaths.length, durations.length);
  if (n === 0) throw new Error("No scenes to render");

  const workDir = join(tmpdir(), `brand-video-${Date.now()}`);
  await mkdir(workDir, { recursive: true });

  try {
    const sceneVideos: string[] = [];
    for (let i = 0; i < n; i++) {
      const sec = Math.max(1, Math.min(15, durations[i] ?? 4));
      const scenePath = join(workDir, `scene_${i}.mp4`);
      const d = Math.round(sec * FPS);
      // zoompan (zoom-in) + optional fade in/out
      let filter = `[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},zoompan=z='min(zoom+0.0008,1.2)':d=${d}:s=${WIDTH}x${HEIGHT}:fps=${FPS}`;
      filter += `,fade=t=in:st=0:d=0.5,fade=t=out:st=${sec - 0.5}:d=0.5[v]`;
      await execFfmpeg([
        "-y", "-loop", "1", "-i", imagePaths[i], "-i", audioPaths[i],
        "-filter_complex", filter, "-map", "[v]", "-map", "1:a",
        "-c:v", "libx264", "-t", String(sec), "-shortest", "-pix_fmt", "yuv420p",
        scenePath,
      ]);
      sceneVideos.push(scenePath);
    }

    const listPath = join(workDir, "concat.txt");
    const listContent = sceneVideos.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
    await writeFile(listPath, listContent);

    const outDir = join(outputPath, "..");
    await mkdir(outDir, { recursive: true });
    await execFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath]);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
