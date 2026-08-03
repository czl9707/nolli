import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import type { Manifest } from "./manifest";

const SEGMENTS = [
  { id: "OutroName", file: "outro-name.mp4" },
  { id: "OutroCount", file: "outro-count.mp4" },
  { id: "OutroNow", file: "outro-now.mp4" },
  { id: "OutroLogo", file: "outro-logo.mp4" },
] as const;

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: assets:outro <architect-slug>");
    process.exit(1);
  }
  const fontVariant = "playful";
  const outDir = resolve("out", slug);
  mkdirSync(outDir, { recursive: true });

  const manifestPath = resolve(outDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}. Run \`pnpm manifest ${slug}\` first.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

  console.log("Bundling…");
  const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });

  for (const seg of SEGMENTS) {
    const inputProps = { manifest, fontVariant };
    const composition = await selectComposition({ serveUrl, id: seg.id, inputProps });
    const out = resolve(outDir, seg.file);
    console.log(`Rendering ${seg.id} → ${out}`);
    await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out });
  }
  console.log(`Done. ${SEGMENTS.length} outro clips written to out/${slug}/.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
