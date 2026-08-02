import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import {
  copyFileSync, existsSync, mkdirSync, readFileSync, rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { loadPlaylist, validatePlaylist } from "./playlist";
import type { Manifest } from "./manifest";

const DEFAULT_FONT = "playful";

// Stage the curated playlist into public/capture/<slug>/ (what Remotion bundles
// and serves via staticFile), write manifest.json, then render.
async function main() {
  const slug = process.argv[2] ?? "sanaa";
  const outDir = resolve("out", slug);
  const playlist = loadPlaylist(outDir);

  const missing = validatePlaylist(playlist, outDir);
  if (missing.length) {
    console.error("Missing files referenced by video.json:\n  " + missing.join("\n  "));
    process.exit(1);
  }

  // Reset and recreate the staging dir.
  const stageDir = resolve("public/capture", slug);
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });

  // Base manifest (buildings/count/hero) from `pnpm manifest <slug>` at
  // out/<slug>/manifest.json. Assemble adds the curated stills/morph and feeds
  // the whole manifest to the render via inputProps (no manifest file in public/).
  const manifestPath = join(outDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}. Run \`pnpm manifest ${slug}\` first.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

  // Stage images (flatten into public/capture/<slug>/) and build stills paths.
  const stills: { path: string }[] = [];
  for (const img of playlist.images) {
    const flat = img.split("/").pop()!;
    copyFileSync(join(outDir, img), join(stageDir, flat));
    stills.push({ path: `capture/${slug}/${flat}` }); // public/-relative for staticFile
  }
  manifest.stills = stills;

  // Stage morph + end-still if present.
  if (playlist.morph) {
    const morphFlat = playlist.morph.split("/").pop()!;
    copyFileSync(join(outDir, playlist.morph), join(stageDir, morphFlat));
    manifest.mapClip = `capture/${slug}/${morphFlat}`;
    const endSrc = join(outDir, "morph-end.png");
    if (existsSync(endSrc)) {
      copyFileSync(endSrc, join(stageDir, "morph-end.png"));
      manifest.mapClipEnd = `capture/${slug}/morph-end.png`;
    } else {
      // Clear any stale end-still carried in from the base-manifest backup
      // (e.g. a legacy `capture` run polluted it) so Scene 2 doesn't staticFile
      // a non-existent file.
      manifest.mapClipEnd = undefined;
    }
  } else {
    manifest.mapClip = undefined;
    manifest.mapClipEnd = undefined;
  }

  console.log(`Staged ${stills.length} stills${manifest.mapClip ? " + morph" : ""} → ${stageDir}`);

  console.log("Bundling…");
  const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
  const inputProps = {
    manifest,
    fontVariant: DEFAULT_FONT,
  };
  const composition = await selectComposition({
    serveUrl,
    id: "ArchitectSpotlight",
    inputProps,
  });
  const out = resolve(outDir, `${slug}.mp4`);
  console.log(`Rendering → ${out}`);
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out });
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
