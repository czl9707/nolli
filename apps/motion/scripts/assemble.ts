import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { basename, join, resolve } from "node:path";
import { FPS } from "../src/lib/timing";
import type { Scene, VideoConfig, VideoScene } from "../src/lib/scenes";

const execFileP = promisify(execFile);
const DEFAULT_FONT = "playful";

function loadVideoConfig(outDir: string): VideoConfig {
  const file = join(outDir, "video.json");
  if (!existsSync(file)) {
    throw new Error(`No video.json at ${file}. Run \`pnpm seed <slug>\` first.`);
  }
  return JSON.parse(readFileSync(file, "utf8")) as VideoConfig;
}

// Collect every file referenced by a scene (src + optional endStill) and report
// any that don't exist in the out dir.
function missingFiles(config: VideoConfig, outDir: string): string[] {
  const missing: string[] = [];
  for (const s of config.scenes) {
    if (s.type === "image") if (!existsSync(join(outDir, s.src))) missing.push(s.src);
    if (s.type === "video") {
      if (!existsSync(join(outDir, s.src))) missing.push(s.src);
      if (s.endStill && !existsSync(join(outDir, s.endStill))) missing.push(s.endStill);
    }
  }
  return missing;
}

async function probeClipFrames(path: string): Promise<number> {
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

async function main() {
  const slug = process.argv[2] ?? "sanaa";
  const outDir = resolve("out", slug);
  const config = loadVideoConfig(outDir);

  const missing = missingFiles(config, outDir);
  if (missing.length) {
    console.error("Missing files referenced by video.json:\n  " + missing.join("\n  "));
    process.exit(1);
  }

  // Reset and recreate the staging dir.
  const stageDir = resolve("public/capture", slug);
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });

  // Stage every referenced file (flatten into public/capture/<slug>/) and rewrite
  // each scene's path to its capture/<slug>/<flat> form for staticFile.
  const copyIn = (rel: string) => {
    const flat = basename(rel);
    copyFileSync(join(outDir, rel), join(stageDir, flat));
    return `capture/${slug}/${flat}`;
  };
  const stagedScenes: Scene[] = config.scenes.map((s): Scene => {
    if (s.type === "image") return { ...s, src: copyIn(s.src) };
    if (s.type === "video") {
      const out: VideoScene = { ...s, src: copyIn(s.src) };
      if (s.endStill) out.endStill = copyIn(s.endStill);
      return out;
    }
    return s;
  });

  // ffprobe each staged video so durationOf can size it accurately.
  for (const s of stagedScenes) {
    if (s.type === "video") {
      s.frames = await probeClipFrames(join(stageDir, basename(s.src)));
    }
  }

  const staged: VideoConfig = { ...config, scenes: stagedScenes };
  const counts = stagedScenes.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Staged ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")} → ${stageDir}`);

  console.log("Bundling…");
  const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
  const inputProps = { config: staged, fontVariant: staged.fontVariant ?? DEFAULT_FONT };
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
