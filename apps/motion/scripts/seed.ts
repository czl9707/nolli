import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Manifest, BuildingRow } from "./manifest";
import { farthestFrom } from "./geo";
import { countText, NOW_TEXT } from "../src/lib/outro";
import { DEFAULT_TUNING, SEAM_AFTER_BEAT_DEFAULT, type MorphConfig, type Journey } from "./morph-config";
import type { Scene, VideoConfig } from "../src/lib/scenes";

const FONT_DEFAULT = "playful" as const;
const MORPH_RATE = 2;

const detailSrc = (b: BuildingRow) => `images/${b.slug}-detail.png`;
const boardSrc = (b: BuildingRow) => `images/${b.slug}-board.png`;

export { countText };

export function freshJourney(manifest: Manifest): Journey {
  return { hero: manifest.hero, far: farthestFrom(manifest.buildings, manifest.hero).slug };
}

export function buildScenes(manifest: Manifest): Scene[] {
  const scenes: Scene[] = [];
  scenes.push({ type: "text", text: manifest.architect, size: 132, color: "fg" });
  for (const b of manifest.buildings) scenes.push({ type: "image", src: detailSrc(b) });
  scenes.push({ type: "text", text: countText(manifest.count), size: 104, color: "fg" });
  for (const b of manifest.buildings) scenes.push({ type: "image", src: boardSrc(b) });
  scenes.push({ type: "text", text: NOW_TEXT, size: 104, color: "fgSecondary" });
  scenes.push({ type: "video", src: "morph-1.mp4", playbackRate: MORPH_RATE });
  scenes.push({ type: "video", src: "morph-2.mp4", playbackRate: MORPH_RATE, endStill: "morph-end.png" });
  scenes.push({ type: "logo" });
  return scenes;
}

export function writeMorphJson(dir: string, manifest: Manifest): MorphConfig {
  const path = join(dir, "morph.json");
  const existing = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as Partial<MorphConfig>)
    : {};
  const cfg: MorphConfig = {
    journey: existing.journey ?? freshJourney(manifest),
    seamAfterBeat: existing.seamAfterBeat ?? SEAM_AFTER_BEAT_DEFAULT,
    tuning: { ...DEFAULT_TUNING, ...existing.tuning },
  };
  writeFileSync(path, JSON.stringify(cfg, null, 2));
  return cfg;
}

export function writeVideoJson(dir: string, slug: string, scenes: Scene[]): void {
  const path = join(dir, "video.json");
  if (existsSync(path)) {
    const existing = JSON.parse(readFileSync(path, "utf8")) as Partial<VideoConfig>;
    if (existing.slug === slug) {
      console.log(`video.json exists for ${slug}; preserved (delete it to re-seed fresh).`);
      return;
    }
  }
  const cfg: VideoConfig = { slug, fontVariant: FONT_DEFAULT, scenes };
  writeFileSync(path, JSON.stringify(cfg, null, 2));
  console.log(`Wrote ${path} (${scenes.length} scenes).`);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: seed <architect-slug>");
    process.exit(1);
  }
  const dir = resolve("out", slug);
  const manifestPath = join(dir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}. Run \`pnpm manifest ${slug}\` first.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  mkdirSync(dir, { recursive: true });

  const morph = writeMorphJson(dir, manifest);
  writeVideoJson(dir, slug, buildScenes(manifest));
  console.log(
    `Seeded morph.json (journey ${morph.journey.hero}→${morph.journey.far}, ` +
      `seam after beat ${morph.seamAfterBeat}) and video.json for ${slug}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
