import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Manifest, BuildingRow } from "./manifest";
import { farthestFrom } from "./geo";
import { countText, NOW_TEXT } from "../src/lib/outro";
import { SEAM_AFTER_BEAT_DEFAULT, type Journey } from "./morph-config";
import type { Scene, VideoConfig } from "../src/lib/scenes";

const FONT_DEFAULT = "playful" as const;
const MORPH_RATE = 2;

const detailSrc = (b: BuildingRow) => `images/${b.slug}-detail.png`;
const boardSrc = (b: BuildingRow) => `images/${b.slug}-board.png`;

export { countText };

export function freshJourney(manifest: Manifest): Journey {
  return { hero: manifest.hero, far: farthestFrom(manifest.buildings, manifest.hero).slug };
}

// Scene order leads with photos (board images) so the social-media preview
// thumbnail is a real image, not the dark text card. The default cut uses ONE
// morph chunk (the journey → board reveal); "Now available in" sits between it
// and the logo. To ship the long-form demo, add the morph-2 entry back here or
// in video.json (its capture is still produced by assets:morph).
export function buildScenes(manifest: Manifest): Scene[] {
  const scenes: Scene[] = [];
  for (const b of manifest.buildings) scenes.push({ type: "image", src: boardSrc(b) });
  scenes.push({ type: "text", text: manifest.architect, size: 132, color: "fg" });
  for (const b of manifest.buildings) scenes.push({ type: "image", src: detailSrc(b) });
  scenes.push({ type: "text", text: countText(manifest.count), size: 104, color: "fg" });
  scenes.push({ type: "video", src: "morph-1.mp4", playbackRate: MORPH_RATE });
  scenes.push({ type: "text", text: NOW_TEXT, size: 104, color: "fg" });
  scenes.push({ type: "logo" });
  return scenes;
}

export function writeMorphJson(dir: string, manifest: Manifest): { journey: Journey; seamAfterBeat: number } {
  const path = join(dir, "morph.json");
  const existing = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as { journey?: Journey; seamAfterBeat?: number })
    : {};
  const cfg = {
    journey: existing.journey ?? freshJourney(manifest),
    seamAfterBeat: existing.seamAfterBeat ?? SEAM_AFTER_BEAT_DEFAULT,
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
