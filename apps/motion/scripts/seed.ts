import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ensureDb, resolveArchitectName, queryArchitectBuildings } from "./db";
import { buildReelConfig } from "./config-builder";
import type { ReelConfig } from "../src/lib/config";

const OUT_DIR = (slug: string) => resolve("out", slug);

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error("Usage: seed <architect-slug>");

  const dbPath = await ensureDb();
  const architect = resolveArchitectName(dbPath, slug);
  const buildings = queryArchitectBuildings(dbPath, architect);
  const outDir = OUT_DIR(slug);
  mkdirSync(outDir, { recursive: true });

  const cfgPath = resolve(outDir, "reel.json");
  let episode = 1;
  if (existsSync(cfgPath)) {
    try { episode = (JSON.parse(readFileSync(cfgPath, "utf8")) as ReelConfig).episode ?? 1; } catch { /* ignore */ }
  }

  if (existsJsonShape(cfgPath)) {
    console.log(`reel.json exists at ${cfgPath}; not overwritten. Delete it to re-seed.`);
    return;
  }

  const cfg = buildReelConfig({ slug, architect, buildings, episode });
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log(`wrote ${cfgPath} — ${cfg.buildings.length} buildings, hook=${cfg.hookSlug}`);
}

function existsJsonShape(p: string): boolean {
  if (!existsSync(p)) return false;
  try { JSON.parse(readFileSync(p, "utf8")); return true; } catch { return false; }
}

main().catch((e) => { console.error(e); process.exit(1); });
