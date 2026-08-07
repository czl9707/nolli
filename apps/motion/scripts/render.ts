import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const BROWSER =
  process.env.REMOTION_BROWSER_EXECUTABLE ??
  ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) => existsSync(p));

function stageAssets(slug: string): void {
  const srcCfg = resolve("out", slug, "reel.json");
  if (!existsSync(srcCfg)) throw new Error(`No reel.json at ${srcCfg}. Run seed first.`);
  const capDir = resolve("public", "capture", slug);
  mkdirSync(capDir, { recursive: true });
  copyFileSync(srcCfg, resolve(capDir, "reel.json"));
  const allSrc = resolve("out", "all-buildings.json");
  if (existsSync(allSrc)) {
    const captureRoot = resolve("public", "capture");
    if (!existsSync(captureRoot)) mkdirSync(captureRoot, { recursive: true });
    copyFileSync(allSrc, resolve(captureRoot, "all-buildings.json"));
  } else {
    console.warn("Warning: out/all-buildings.json missing — map will show no background markers. Run seed.");
  }
  if (!existsSync(resolve(capDir, "images"))) {
    console.warn(`Warning: public/capture/${slug}/images missing — run 'assets ${slug}' or hero/thumb images will 404.`);
  }
}

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error("Usage: render <architect-slug>");
  if (!BROWSER) throw new Error("No system Chrome/Chromium found. Set REMOTION_BROWSER_EXECUTABLE.");

  stageAssets(slug);

  const entry = resolve("src", "index.ts");
  console.log("bundling…");
  const serveUrl = await bundle({ entryPoint: entry });

  const inputProps = { slug };
  const comp = await selectComposition({ serveUrl, id: "reel", inputProps, browserExecutable: BROWSER });

  const maxFrames = process.env.REEL_MAX_FRAMES ? Number(process.env.REEL_MAX_FRAMES) : comp.durationInFrames;
  const composition = { ...comp, durationInFrames: Math.min(maxFrames, comp.durationInFrames) };

  const outDir = resolve("out", slug);
  mkdirSync(outDir, { recursive: true });
  const suffix = maxFrames < comp.durationInFrames ? `-${maxFrames}f` : "";
  const outPath = resolve(outDir, `${slug}${suffix}.mp4`);
  console.log(`rendering ${composition.durationInFrames} frames -> ${outPath}`);
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outPath,
    chromiumOptions: { gl: "angle" },
    browserExecutable: BROWSER,
    inputProps,
    onProgress: ({ progress }) => process.stdout.write(`\r${(progress * 100).toFixed(1)}%`),
  });
  console.log(`\ndone -> ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
