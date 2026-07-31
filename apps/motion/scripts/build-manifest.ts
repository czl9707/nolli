import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ensureDb, queryArchitectBuildings } from "./db";
import { rowsToManifest, type Manifest } from "./manifest";

const ARCHITECTS: Record<string, { name: string; hero?: string }> = {
  sanaa: { name: "SANAA", hero: "rolex-learning-center" },
};

async function main() {
  const slug = process.argv[2] ?? "sanaa";
  const cfg = ARCHITECTS[slug];
  if (!cfg) throw new Error(`Unknown architect slug "${slug}". Add it to ARCHITECTS.`);
  const dbPath = await ensureDb();
  const rows = queryArchitectBuildings(dbPath, cfg.name);
  if (rows.length === 0) throw new Error(`No buildings found for "${cfg.name}".`);
  const manifest: Manifest = rowsToManifest(rows, { architect: cfg.name, slug, heroSlug: cfg.hero });
  const dir = resolve("public/capture", slug);
  mkdirSync(dir, { recursive: true });
  const out = join(dir, "manifest.json");
  writeFileSync(out, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${out} (${manifest.count} buildings, hero=${manifest.hero})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
