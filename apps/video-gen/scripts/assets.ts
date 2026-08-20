import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import type { ReelBuilding } from "../src/lib/config";
import { runCli } from "./runCli";
import { dataDir } from "./paths";
import { loadReelConfig } from "./staging";

async function stageBuilding(slug: string, b: ReelBuilding): Promise<void> {
  if (!b.coverImage) {
    console.warn(`  ${b.slug}: no cover image; skipping`);
    return;
  }
  const dir = join(dataDir(slug), "images");
  mkdirSync(dir, { recursive: true });
  const heroPath = join(dir, `${b.slug}-hero.jpg`);
  if (!existsSync(heroPath)) {
    const raw = await fetch(b.coverImage).then((r) => (r.ok ? r.arrayBuffer() : null));
    if (!raw) {
      console.warn(`  ${b.slug}: download failed`);
      return;
    }
    await sharp(Buffer.from(raw)).rotate().jpeg({ quality: 92 }).toFile(heroPath);
  }
}

const CONCURRENCY = 6;

runCli("assets", async (slug) => {
  const cfg = loadReelConfig(slug);
  mkdirSync(dataDir(slug), { recursive: true });

  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, cfg.buildings.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= cfg.buildings.length) return;
      const b = cfg.buildings[i];
      process.stdout.write(`staging ${b.slug}…\n`);
      await stageBuilding(slug, b);
    }
  });
  await Promise.all(workers);
  console.log(`done -> public/data/${slug}/`);
});
