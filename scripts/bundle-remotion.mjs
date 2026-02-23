/**
 * Bundle Remotion project for server-side rendering.
 * Run outside Next.js (e.g. "node scripts/bundle-remotion.mjs") so Webpack is not bundled.
 * Output: .remotion-bundle (used by POST /api/render-video as serveUrl).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const entryPoint = path.join(projectRoot, "remotion", "index.ts");
const outDir = path.join(projectRoot, ".remotion-bundle");

async function main() {
  console.log("Bundling Remotion (entry: remotion/index.ts)...");
  const bundleLocation = await bundle({
    entryPoint,
    outDir,
    onProgress: (p) => {
      const percent = Math.round(p * 100);
      if (percent % 20 === 0 || percent === 100) process.stdout.write(`  ${percent}%\n`);
    },
  });
  console.log("Bundle written to:", bundleLocation);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
