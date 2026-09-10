import { mkdirSync, writeFileSync } from "node:fs";
import {
  ensureDb,
  resolveArchitectName,
  queryArchitectBuildings,
  type ArchRow,
} from "@nolli/remotion/db";
import type { ReelBuilding } from "@/lib/config";
import { buildReelConfig } from "./config-builder";
import { runCli } from "@nolli/remotion/cli";
import { outDir, reelConfigPath } from "./paths";

// Raw DB columns → the reel's building shape.
const toReelBuilding = (r: ArchRow): ReelBuilding => ({
  slug: r.slug,
  name: r.name,
  year: r.year,
  city: r.city ?? "—",
  countryCode: r.cc ?? "",
  coordinates: { lng: r.lng, lat: r.lat },
  coverImage: r.cover ?? "",
});

runCli("seed", async (slug) => {
  const dbPath = await ensureDb();
  const architect = resolveArchitectName(dbPath, slug);
  const buildings = queryArchitectBuildings(dbPath, architect).map(toReelBuilding);
  mkdirSync(outDir(slug), { recursive: true });

  const cfg = buildReelConfig({ slug, architect, buildings });
  const cfgPath = reelConfigPath(slug);
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log(`wrote ${cfgPath} — ${cfg.buildings.length} buildings`);
});
