import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { runCli, browserExecutable } from "@nolli/remotion/cli";
import { outDir, dataDir, dataAllArchPath, allArchPath, reelConfigPath } from "./paths";

function stageAssets(slug: string): void {
  const data = dataDir(slug);
  mkdirSync(data, { recursive: true });
  copyFileSync(reelConfigPath(slug), resolve(data, "reel.json"));
  if (existsSync(allArchPath())) {
    copyFileSync(allArchPath(), dataAllArchPath());
  } else {
    console.warn("Warning: out/all-arch.json missing — map will show no background markers. Run seed.");
  }
  if (!existsSync(resolve(data, "images"))) {
    console.warn(`Warning: public/data/${slug}/images missing — run 'assets ${slug}' or hero images will 404.`);
  }
}

runCli("render", async (slug) => {
  const BROWSER = browserExecutable();

  stageAssets(slug);

  const entry = resolve("src", "index.ts");
  console.log("bundling…");
  const serveUrl = await bundle({ entryPoint: entry });

  const inputProps = { slug };
  const comp = await selectComposition({ serveUrl, id: "reel", inputProps, browserExecutable: BROWSER });

  const maxFrames = process.env.REEL_MAX_FRAMES ? Number(process.env.REEL_MAX_FRAMES) : comp.durationInFrames;
  const composition = { ...comp, durationInFrames: Math.min(maxFrames, comp.durationInFrames) };
  // Each worker is a separate tab with its own MapLibre instance; with several,
  // some tabs get captured mid-settle — visible as label blink after landings.
  // Default 1 worker for deterministic output; raise via REEL_CONCURRENCY.
  const concurrency = process.env.REEL_CONCURRENCY ? Number(process.env.REEL_CONCURRENCY) : 1;

  const outPathDir = outDir(slug);
  mkdirSync(outPathDir, { recursive: true });
  const suffix = maxFrames < comp.durationInFrames ? `-${maxFrames}f` : "";
  const outPath = resolve(outPathDir, `${slug}${suffix}.mp4`);
  console.log(`rendering ${composition.durationInFrames} frames -> ${outPath}`);
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    // Size lever: 20 lands a 28s reel around ~70MB (default CRF ~18 → ~100MB).
    crf: process.env.REEL_CRF ? Number(process.env.REEL_CRF) : 20,
    outputLocation: outPath,
    concurrency,
    chromiumOptions: { gl: "angle" },
    browserExecutable: BROWSER,
    inputProps,
    onProgress: ({ progress }) => process.stdout.write(`\r${(progress * 100).toFixed(1)}%`),
  });
  console.log(`\ndone -> ${outPath}`);
});
