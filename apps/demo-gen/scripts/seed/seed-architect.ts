import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { runCli } from "@nolli/remotion/cli";
import { ensureDb, queryArchitectBuildings, resolveArchitectName } from "@nolli/remotion/db";
import type { Manifest } from "./manifest";
import { rowsToManifest } from "./manifest";
import type { Journey } from "./demo-config";
import {
  architectScenes,
  architectShots,
  toBuildingRow,
  writeDemoJson,
  writeImagesJson,
  writeManifest,
  writeVideoJson,
} from "./seed-common";

// The seeded journey defaults to the earliest building plus one random other;
// to visit different buildings, edit "journey" in demo.json after seeding.
export function freshJourney(manifest: Manifest): Journey {
  const [first] = manifest.buildings;
  const others = manifest.buildings.slice(1);
  const second = others[Math.floor(Math.random() * others.length)];
  return [first.slug, second?.slug ?? first.slug];
}

async function main(slug: string) {
  const fresh = process.argv.includes("--fresh");
  const dir = resolve("out", slug);
  mkdirSync(dir, { recursive: true });

  const dbPath = await ensureDb(fresh);
  const architect = resolveArchitectName(dbPath, slug);
  const rows = queryArchitectBuildings(dbPath, architect).map(toBuildingRow);
  if (rows.length === 0) throw new Error(`No buildings found for "${architect}".`);
  const manifest: Manifest = rowsToManifest(rows, { architect, slug });
  writeManifest(dir, manifest);

  const demo = writeDemoJson(dir, freshJourney(manifest));
  const shots = writeImagesJson(dir, architectShots(manifest));
  writeVideoJson(dir, slug, architectScenes(manifest, shots));
  console.log(
    `Seeded demo.json (journey ${demo.join(" → ")}), images.json, and video.json for ${slug}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  runCli("seed:architect", main, "<architect-slug>");
}
