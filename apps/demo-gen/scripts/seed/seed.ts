import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { runCli } from "@nolli/remotion/cli";
import type { Manifest, BuildingRow } from "./manifest";
import { rowsToManifest } from "./manifest";
import { ensureDb, queryArchitectBuildings, resolveArchitectName, type ArchRow } from "@nolli/remotion/db";
import { countText, NOW_TEXT } from "../../src/lib/constants";
import { type Journey, type DemoConfigFile } from "./demo-config";
import { DEFAULT_FONT_VARIANT, type Scene, type VideoConfig } from "../../src/lib/scenes";

const DEMO_RATE = 2;

const toBuildingRow = (r: ArchRow): BuildingRow => ({
  slug: r.slug,
  name: r.name,
  year: r.year,
  city: r.city ?? "",
  cc: r.cc ?? "",
  latitude: r.lat,
  longitude: r.lng,
});

const detailSrc = (b: BuildingRow) => `images/${b.slug}-detail.png`;
const boardSrc = (b: BuildingRow) => `images/${b.slug}-board.png`;

// The seeded journey defaults to the earliest building plus one random other;
// to visit different buildings, edit "journey" in demo.json after seeding.
function resolveAndWriteManifest(dbPath: string, dir: string, slug: string): Manifest {
  const architect = resolveArchitectName(dbPath, slug);
  const rows = queryArchitectBuildings(dbPath, architect).map(toBuildingRow);
  if (rows.length === 0) throw new Error(`No buildings found for "${architect}".`);
  const manifest = rowsToManifest(rows, { architect, slug });
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${join(dir, "manifest.json")} (${manifest.buildings.length} buildings).`);
  return manifest;
}

export function freshJourney(manifest: Manifest): Journey {
  const [first] = manifest.buildings;
  const others = manifest.buildings.slice(1);
  const second = others[Math.floor(Math.random() * others.length)];
  return [first.slug, second?.slug ?? first.slug];
}

export function buildScenes(manifest: Manifest): Scene[] {
  const scenes: Scene[] = [];
  scenes.push({ type: "video", src: "demo-1.mp4", playbackRate: DEMO_RATE });
  scenes.push({ type: "text", text: manifest.architect, size: 132, color: "fg" });
  for (const b of manifest.buildings) scenes.push({ type: "image", src: boardSrc(b) });
  scenes.push({ type: "text", text: countText(manifest.buildings.length), size: 104, color: "fg" });
  for (const b of manifest.buildings) scenes.push({ type: "image", src: detailSrc(b) });
  scenes.push({ type: "text", text: NOW_TEXT, size: 104, color: "fg" });
  scenes.push({ type: "logo" });
  return scenes;
}

export function writeDemoJson(dir: string, manifest: Manifest): Journey {
  const path = join(dir, "demo.json");
  const existing = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as Partial<DemoConfigFile>)
    : {};
  const journey = existing.journey ?? freshJourney(manifest);
  writeFileSync(path, JSON.stringify({ journey }, null, 2));
  return journey;
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
  const cfg: VideoConfig = { slug, fontVariant: DEFAULT_FONT_VARIANT, scenes };
  writeFileSync(path, JSON.stringify(cfg, null, 2));
  console.log(`Wrote ${path} (${scenes.length} scenes).`);
}

async function main(slug: string, { fresh }: { fresh?: boolean }) {
  const dir = resolve("out", slug);
  mkdirSync(dir, { recursive: true });

  const dbPath = await ensureDb(fresh);
  const manifest = resolveAndWriteManifest(dbPath, dir, slug);

  const demo = writeDemoJson(dir, manifest);
  writeVideoJson(dir, slug, buildScenes(manifest));
  console.log(
    `Seeded demo.json (journey ${demo.join(" → ")}) and video.json for ${slug}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  runCli("seed", main);
}
