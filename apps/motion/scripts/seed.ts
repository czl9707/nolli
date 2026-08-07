import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Manifest, BuildingRow } from "./manifest";
import { rowsToManifest } from "./manifest";
import { ensureDb, queryArchitectBuildings, resolveArchitect } from "./db";
import { farthestFrom } from "./geo";
import { countText, NOW_TEXT } from "../src/lib/outro";
import { SEAM_AFTER_BEAT_DEFAULT, type Journey } from "./demo-config";
import type { Scene, VideoConfig } from "../src/lib/scenes";

const FONT_DEFAULT = "playful" as const;
const DEMO_RATE = 2;

const detailSrc = (b: BuildingRow) => `images/${b.slug}-detail.png`;
const boardSrc = (b: BuildingRow) => `images/${b.slug}-board.png`;

export { countText };

// Resolve the architect + buildings from sqlite and write out/<slug>/manifest.json.
// The hero always defaults to the earliest building (year-ascending); to open on
// a different building, edit journey.hero in demo.json after seeding. This was
// formerly the standalone `manifest` command — now folded into `seed`.
export function writeManifest(dir: string, slug: string, manifest: Manifest): void {
  const out = join(dir, "manifest.json");
  writeFileSync(out, JSON.stringify(manifest, null, 2));
}

function resolveAndWriteManifest(dbPath: string, dir: string, slug: string): Manifest {
  const architect = resolveArchitect(dbPath, slug);
  const rows = queryArchitectBuildings(dbPath, architect);
  if (rows.length === 0) throw new Error(`No buildings found for "${architect}".`);
  const manifest = rowsToManifest(rows, { architect, slug });
  writeManifest(dir, slug, manifest);
  console.log(`Wrote ${join(dir, "manifest.json")} (${manifest.count} buildings, hero=${manifest.hero}).`);
  return manifest;
}

export function freshJourney(manifest: Manifest): Journey {
  return { hero: manifest.hero, far: farthestFrom(manifest.buildings, manifest.hero).slug };
}

// Scene order leads with the demo (journey → board reveal), then alternates
// text → images → text → images → text → logo: name, board photos, count,
// detail photos, "Now available in". The default cut uses ONE demo chunk; to
// ship the long-form demo, add the demo-2 entry here or in video.json (its
// capture is still produced by assets:demo).
export function buildScenes(manifest: Manifest): Scene[] {
  const scenes: Scene[] = [];
  scenes.push({ type: "video", src: "demo-1.mp4", playbackRate: DEMO_RATE });
  scenes.push({ type: "text", text: manifest.architect, size: 132, color: "fg" });
  for (const b of manifest.buildings) scenes.push({ type: "image", src: boardSrc(b) });
  scenes.push({ type: "text", text: countText(manifest.count), size: 104, color: "fg" });
  for (const b of manifest.buildings) scenes.push({ type: "image", src: detailSrc(b) });
  scenes.push({ type: "text", text: NOW_TEXT, size: 104, color: "fg" });
  scenes.push({ type: "logo" });
  return scenes;
}

export function writeDemoJson(dir: string, manifest: Manifest): { journey: Journey; seamAfterBeat: number } {
  const path = join(dir, "demo.json");
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
  mkdirSync(dir, { recursive: true });

  // Resolve from the DB and write manifest.json (formerly the `manifest` step),
  // then derive the two editable configs from it.
  const dbPath = await ensureDb();
  const manifest = resolveAndWriteManifest(dbPath, dir, slug);

  const demo = writeDemoJson(dir, manifest);
  writeVideoJson(dir, slug, buildScenes(manifest));
  console.log(
    `Seeded demo.json (journey ${demo.journey.hero}→${demo.journey.far}, ` +
      `seam after beat ${demo.seamAfterBeat}) and video.json for ${slug}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
