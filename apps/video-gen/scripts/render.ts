import { bundle as remotionBundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli, browserExecutable } from "@nolli/remotion/cli";
import { outDir, dataDir, reelConfigPath } from "./paths";
import { parseVariantArg } from "@/lib/variant";
import { parseThemeArg } from "@/lib/theme";

/** bundle() with the app tsconfig's `@/*` → `src/*` alias and the ui paper
 *  texture's `/patterns/...` CSS urls aliased to this app's public dir —
 *  vite serves those urls from public/, webpack can't see public/ and fails
 *  the resolve. Run from apps/video-gen. */
export function bundleApp(entryPoint: string): Promise<string> {
  return remotionBundle({
    entryPoint,
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias as Record<string, string> | undefined),
          "@": resolve("src"),
          "/patterns": resolve("public", "patterns"),
        },
      },
    }),
  });
}

export function stageAssets(slug: string): void {
  const data = dataDir(slug);
  mkdirSync(data, { recursive: true });
  copyFileSync(reelConfigPath(slug), resolve(data, "reel.json"));
  if (!existsSync(resolve(data, "images"))) {
    console.warn(`Warning: public/data/${slug}/images missing — run 'assets ${slug}' or hero images will 404.`);
  }
}

// Direct-entry guard: verify.ts imports bundleApp from this module.
if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
runCli("render", async (slug, flags) => {
  const BROWSER = browserExecutable();

  stageAssets(slug);

  const entry = resolve("src", "index.ts");
  console.log("bundling…");
  const serveUrl = await bundleApp(entry);

  const variant = parseVariantArg(flags.variant);
  // The reel theme flag lives here, not in @nolli/remotion's shared parser —
  // it's a video-gen concept (demo-gen shares that CLI).
  const themeIdx = process.argv.indexOf("--theme");
  const theme = parseThemeArg(themeIdx !== -1 ? process.argv[themeIdx + 1] : undefined);
  const inputProps = { slug, variant, theme };
  const comp = await selectComposition({ serveUrl, id: "reel", inputProps, browserExecutable: BROWSER });

  const maxFrames = process.env.REEL_MAX_FRAMES ? Number(process.env.REEL_MAX_FRAMES) : comp.durationInFrames;
  const composition = { ...comp, durationInFrames: Math.min(maxFrames, comp.durationInFrames) };
  // Each worker is a separate tab with its own MapLibre instance; with several,
  // some tabs get captured mid-settle — visible as label blink after landings.
  // Default 1 worker for deterministic output; raise via REEL_CONCURRENCY.
  const concurrency = process.env.REEL_CONCURRENCY ? Number(process.env.REEL_CONCURRENCY) : 1;

  const outPathDir = outDir(slug);
  mkdirSync(outPathDir, { recursive: true });
  const frameSuffix = maxFrames < comp.durationInFrames ? `-${maxFrames}f` : "";
  const themeSuffix = theme === "dark" ? "-dark" : "";
  const outPath = resolve(outPathDir, `${slug}-${variant}${themeSuffix}${frameSuffix}.mp4`);
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
}
