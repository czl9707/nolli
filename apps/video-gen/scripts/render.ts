import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { runCli } from "./runCli";
import { outDir, dataDir, dataAllArchPath, allArchPath, reelConfigPath } from "./paths";

const BROWSER =
  process.env.REMOTION_BROWSER_EXECUTABLE ??
  ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) => existsSync(p));

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
    console.warn(`Warning: public/data/${slug}/images missing — run 'assets ${slug}' or hero/thumb images will 404.`);
  }
}

runCli("render", async (slug) => {
  if (!BROWSER) throw new Error("No system Chrome/Chromium found. Set REMOTION_BROWSER_EXECUTABLE.");

  stageAssets(slug);

  const entry = resolve("src", "index.ts");
  console.log("bundling…");
  const serveUrl = await bundle({ entryPoint: entry });

  const inputProps = { slug };
  const comp = await selectComposition({ serveUrl, id: "reel", inputProps, browserExecutable: BROWSER });

  const maxFrames = process.env.REEL_MAX_FRAMES ? Number(process.env.REEL_MAX_FRAMES) : comp.durationInFrames;
  const composition = { ...comp, durationInFrames: Math.min(maxFrames, comp.durationInFrames) };
  // Lower concurrency eases per-frame tile pressure on the vector tile source
  // (a dropped tile leaves a blank hole in that frame).
  const concurrency = process.env.REEL_CONCURRENCY ? Number(process.env.REEL_CONCURRENCY) : undefined;

  const outPathDir = outDir(slug);
  mkdirSync(outPathDir, { recursive: true });
  const suffix = maxFrames < comp.durationInFrames ? `-${maxFrames}f` : "";
  const outPath = resolve(outPathDir, `${slug}${suffix}.mp4`);
  console.log(`rendering ${composition.durationInFrames} frames -> ${outPath}`);
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outPath,
    concurrency,
    chromiumOptions: { gl: "angle" },
    browserExecutable: BROWSER,
    inputProps,
    onProgress: ({ progress }) => process.stdout.write(`\r${(progress * 100).toFixed(1)}%`),
  });
  console.log(`\ndone -> ${outPath}`);
});
