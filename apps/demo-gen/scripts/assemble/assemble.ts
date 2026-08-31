import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { join, resolve } from "node:path";
import { runCli, browserExecutable, readJsonOr } from "@nolli/remotion/cli";
import { FPS } from "../../src/lib/constants";
import type { VideoConfig } from "../../src/lib/scenes";

const execFileP = promisify(execFile);

function loadVideoConfig(outDir: string): VideoConfig {
  return readJsonOr<VideoConfig>(join(outDir, "video.json"), "Run `pnpm seed <slug>` first.");
}

function missingFiles(config: VideoConfig, outDir: string): string[] {
  const missing: string[] = [];
  for (const s of config.scenes) {
    if (s.type === "image" || s.type === "video") {
      if (!existsSync(join(outDir, s.src))) missing.push(s.src);
    }
  }
  return missing;
}

async function getClipFrames(path: string): Promise<number> {
  const { stdout } = await execFileP("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const seconds = parseFloat(stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`ffprobe returned an invalid duration (${JSON.stringify(stdout.trim())}) for ${path}`);
  }
  return Math.round(seconds * FPS);
}

async function main(slug: string) {
  const outDir = resolve("out", slug);
  const config = loadVideoConfig(outDir);

  const missing = missingFiles(config, outDir);
  if (missing.length) {
    console.error("Missing files referenced by video.json:\n  " + missing.join("\n  "));
    process.exit(1);
  }

  // durationOf needs native frame counts — fill them via ffprobe.
  for (const s of config.scenes) {
    if (s.type === "video") s.frames = await getClipFrames(join(outDir, s.src));
  }

  const counts = config.scenes.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Scenes: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")}`);

  console.log("Bundling…");
  // out/<slug> doubles as the Remotion public dir, so scene srcs stay relative
  // to it and resolve via staticFile with no staging copy.
  const serveUrl = await bundle({ entryPoint: resolve("src/index.ts"), publicDir: outDir });
  const composition = await selectComposition({
    serveUrl,
    id: "DemoComposition",
    inputProps: { config },
    browserExecutable: browserExecutable(),
  });
  const out = resolve(outDir, `${slug}.mp4`);
  console.log(`Rendering → ${out}`);
  await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: out, browserExecutable: browserExecutable() });
  console.log("Done.");
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  runCli("assemble", main);
}
