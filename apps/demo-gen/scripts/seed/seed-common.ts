import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Manifest, BuildingRow } from "./manifest";
import { countText, NOW_TEXT } from "../../src/lib/constants";
import { type Journey, type DemoConfigFile } from "./demo-config";
import { type Scene, type VideoConfig } from "../../src/lib/scenes";

const DEMO_RATE = 2;
const SINGLE_DEMO_RATE = 1.5;

export const toBuildingRow = (r: {
  slug: string;
  name: string;
  year: number;
  city: string | null;
  cc: string | null;
  lat: number;
  lng: number;
}): BuildingRow => ({
  slug: r.slug,
  name: r.name,
  year: r.year,
  city: r.city ?? "",
  cc: r.cc ?? "",
  latitude: r.lat,
  longitude: r.lng,
});

// images.json — the shot list assets:images captures, in order. "board" opens
// the n-th photo (0-based, board strip DOM order) in the lightbox; "detail" is
// the architecture page screenshot.
export type BoardShot = { building: string; type: "board"; photo: number };
export type DetailShot = { building: string; type: "detail" };
export type Shot = BoardShot | DetailShot;

export type ImagesConfigFile = { shots: Shot[] };

export const shotSrc = (shot: Shot): string =>
  shot.type === "board"
    ? `images/${shot.building}-board-${shot.photo}.png`
    : `images/${shot.building}-detail.png`;

export function architectShots(manifest: Manifest): Shot[] {
  const shots: Shot[] = [];
  for (const b of manifest.buildings) {
    shots.push({ building: b.slug, type: "detail" });
    shots.push({ building: b.slug, type: "board", photo: 0 });
  }
  return shots;
}

export function architectureShots(slug: string, photoCount: number): Shot[] {
  const shots: Shot[] = [];
  for (let photo = 0; photo < photoCount; photo++) {
    shots.push({ building: slug, type: "board", photo });
  }
  return shots;
}

export function writeManifest(dir: string, manifest: Manifest): void {
  const path = join(dir, "manifest.json");
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${path} (${manifest.buildings.length} buildings).`);
}

export function writeDemoJson(dir: string, defaultJourney: Journey): Journey {
  const path = join(dir, "demo.json");
  const existing = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as Partial<DemoConfigFile>)
    : {};
  const journey = existing.journey ?? defaultJourney;
  writeFileSync(path, JSON.stringify({ journey }, null, 2));
  return journey;
}

export function writeImagesJson(dir: string, shots: Shot[]): Shot[] {
  const path = join(dir, "images.json");
  if (existsSync(path)) {
    console.log(`images.json exists; preserved (delete it to re-seed fresh).`);
    return (JSON.parse(readFileSync(path, "utf8")) as ImagesConfigFile).shots;
  }
  writeFileSync(path, JSON.stringify({ shots }, null, 2));
  console.log(`Wrote ${path} (${shots.length} shots).`);
  return shots;
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
  const cfg: VideoConfig = { slug, scenes };
  writeFileSync(path, JSON.stringify(cfg, null, 2));
  console.log(`Wrote ${path} (${scenes.length} scenes).`);
}

export function architectScenes(manifest: Manifest, shots: Shot[]): Scene[] {
  const scenes: Scene[] = [
    { type: "video", src: "demo-1.mp4", playbackRate: DEMO_RATE },
    { type: "text", text: manifest.architect, size: 132, color: "fg" },
  ];
  for (const s of shots) {
    if (s.type === "board") scenes.push({ type: "image", src: shotSrc(s) });
  }
  scenes.push({ type: "text", text: countText(manifest.buildings.length), size: 104, color: "fg" });
  for (const s of shots) {
    if (s.type === "detail") scenes.push({ type: "image", src: shotSrc(s) });
  }
  scenes.push({ type: "text", text: NOW_TEXT, size: 104, color: "fg" });
  scenes.push({ type: "logo" });
  return scenes;
}

export function architectureScenes(manifest: Manifest, shots: Shot[]): Scene[] {
  const [b] = manifest.buildings;
  const scenes: Scene[] = [
    { type: "video", src: "demo-1.mp4", playbackRate: SINGLE_DEMO_RATE },
    { type: "text", text: b.name, size: 132, color: "fg" },
    { type: "text", text: manifest.architect, size: 104, color: "fg" },
  ];
  const place = [b.city, b.cc].filter(Boolean).join(", ");
  if (place) scenes.push({ type: "text", text: place, size: 104, color: "fg" });
  for (const s of shots) scenes.push({ type: "image", src: shotSrc(s) });
  scenes.push({ type: "text", text: NOW_TEXT, size: 104, color: "fg" });
  scenes.push({ type: "logo" });
  return scenes;
}
