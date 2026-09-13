import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { runCli } from "@nolli/remotion/cli";
import { ensureDb, queryBuildingBySlug } from "@nolli/remotion/db";
import { rowsToManifest } from "./manifest";
import {
  architectureScenes,
  architectureShots,
  toBuildingRow,
  writeDemoJson,
  writeImagesJson,
  writeManifest,
  writeVideoJson,
} from "./seed-common";

async function main(slug: string) {
  const fresh = process.argv.includes("--fresh");
  const dir = resolve("out", slug);
  mkdirSync(dir, { recursive: true });

  const dbPath = await ensureDb(fresh);
  const row = queryBuildingBySlug(dbPath, slug);
  const manifest = rowsToManifest([toBuildingRow(row)], { architect: row.architect, slug });
  writeManifest(dir, manifest);

  const demo = writeDemoJson(dir, [slug]);
  const shots = writeImagesJson(dir, architectureShots(slug, row.photoCount));
  writeVideoJson(dir, slug, architectureScenes(manifest, shots));
  console.log(
    `Seeded demo.json (journey ${demo.join(" → ")}), images.json, and video.json for ${slug}.`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  runCli("seed:architecture", main, "<building-slug>");
}
