import { mkdirSync, writeFileSync } from "node:fs";
import { ensureDb, resolveArchitectName, queryArchitectBuildings, queryAllBuildings } from "./db";
import { buildReelConfig } from "./config-builder";
import { runCli } from "./runCli";
import { outDir, reelConfigPath, allBuildingsPath } from "./paths";
import { reelConfigExists } from "./staging";

runCli("seed", async (slug) => {
  const dbPath = await ensureDb();
  const architect = resolveArchitectName(dbPath, slug);
  const buildings = queryArchitectBuildings(dbPath, architect);
  mkdirSync(outDir(slug), { recursive: true });

  const allPath = allBuildingsPath();
  const allBuildings = queryAllBuildings(dbPath).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    coordinates: { lng: r.lng, lat: r.lat },
  }));
  writeFileSync(allPath, JSON.stringify(allBuildings));
  console.log(`wrote ${allPath} — ${allBuildings.length} buildings`);

  const cfgPath = reelConfigPath(slug);
  if (reelConfigExists(slug)) {
    console.log(`reel.json exists at ${cfgPath}; not overwritten. Delete it to re-seed.`);
    return;
  }

  const cfg = buildReelConfig({ slug, architect, buildings });
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log(`wrote ${cfgPath} — ${cfg.buildings.length} buildings`);
});
