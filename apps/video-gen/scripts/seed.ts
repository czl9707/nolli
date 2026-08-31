import { mkdirSync, writeFileSync } from "node:fs";
import {
  ensureDb,
  resolveArchitectName,
  queryArchitectBuildings,
  queryAllArchPins,
  type ArchRow,
} from "@nolli/remotion/db";
import type { ReelBuilding } from "../src/lib/config";
import { buildReelConfig } from "./config-builder";
import { runCli } from "@nolli/remotion/cli";
import { outDir, reelConfigPath, allArchPath } from "./paths";
import { reelConfigExists } from "./staging";

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

runCli("seed", async (slug, { fresh }) => {
  const dbPath = await ensureDb(fresh);
  const architect = resolveArchitectName(dbPath, slug);
  const buildings = queryArchitectBuildings(dbPath, architect).map(toReelBuilding);
  mkdirSync(outDir(slug), { recursive: true });

  const allPath = allArchPath();
  const allPins = queryAllArchPins(dbPath).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    coordinates: { lng: r.lng, lat: r.lat },
  }));
  writeFileSync(allPath, JSON.stringify(allPins));
  console.log(`wrote ${allPath} — ${allPins.length} pins`);

  const cfgPath = reelConfigPath(slug);
  if (!fresh && reelConfigExists(slug)) {
    console.log(`reel.json exists at ${cfgPath}; not overwritten. Re-run with --fresh to re-seed.`);
    return;
  }

  const cfg = buildReelConfig({ slug, architect, buildings });
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log(`wrote ${cfgPath} — ${cfg.buildings.length} buildings`);
});
