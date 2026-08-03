import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ensureDb, queryArchitectBuildings, resolveArchitect } from "./db";
import { rowsToManifest, type Manifest } from "./manifest";

async function main() {
  // Usage: manifest <slug> [hero-building-slug]
  // Name + buildings come straight from sqlite; the hero defaults to the first
  // building in the (year-ascending) query when no override is given.
  const slug = process.argv[2] ?? "sanaa";
  const heroSlug = process.argv[3];
  const dbPath = await ensureDb();
  const architect = resolveArchitect(dbPath, slug);
  const rows = queryArchitectBuildings(dbPath, architect);
  if (rows.length === 0) throw new Error(`No buildings found for "${architect}".`);
  if (heroSlug && !rows.some((r) => r.slug === heroSlug)) {
    throw new Error(`Hero "${heroSlug}" is not among ${architect}'s ${rows.length} buildings.`);
  }
  const manifest: Manifest = rowsToManifest(rows, { architect, slug, heroSlug });
  const dir = resolve("out", slug);
  mkdirSync(dir, { recursive: true });
  const out = join(dir, "manifest.json");
  writeFileSync(out, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${out} (${manifest.count} buildings, hero=${manifest.hero})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
