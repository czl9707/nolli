import { mkdirSync, writeFileSync } from "node:fs";
import { ensureDb, resolveArchitectName, queryArchitectBuildings, queryAllArchPins } from "./db";
import { buildReelConfig } from "./config-builder";
import { runCli } from "./runCli";
import { outDir, reelConfigPath, allArchPath } from "./paths";
import { reelConfigExists } from "./staging";

runCli("seed", async (slug) => {
  const dbPath = await ensureDb();
  const architect = resolveArchitectName(dbPath, slug);
  const buildings = queryArchitectBuildings(dbPath, architect);
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
  if (reelConfigExists(slug)) {
    console.log(`reel.json exists at ${cfgPath}; not overwritten. Delete it to re-seed.`);
    return;
  }

  const cfg = buildReelConfig({ slug, architect, buildings });
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log(`wrote ${cfgPath} — ${cfg.buildings.length} buildings`);
});
