import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import sharp from "sharp";
import type { ReelConfig, ReelBuilding } from "../src/lib/config";

const PUBLIC_CAPTURE = (slug: string) => resolve("public", "capture", slug);

async function stageBuilding(slug: string, b: ReelBuilding): Promise<void> {
  if (!b.coverImage) {
    console.warn(`  ${b.slug}: no cover image; skipping`);
    return;
  }
  const dir = join(PUBLIC_CAPTURE(slug), "images");
  mkdirSync(dir, { recursive: true });
  const heroPath = join(dir, `${b.slug}-hero.jpg`);
  const thumbPath = join(dir, `${b.slug}-thumb.jpg`);
  if (!existsSync(heroPath)) {
    const raw = await fetch(b.coverImage).then((r) => (r.ok ? r.arrayBuffer() : null));
    if (!raw) {
      console.warn(`  ${b.slug}: download failed`);
      return;
    }
    const rawPath = join(dir, `${b.slug}-raw.jpg`);
    writeFileSync(rawPath, Buffer.from(raw));
    await sharp(rawPath).resize(1600, 1000, { fit: "cover" }).jpeg({ quality: 88 }).toFile(heroPath);
    await sharp(rawPath).resize(240, 240, { fit: "cover" }).jpeg({ quality: 80 }).toFile(thumbPath);
  }
}

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error("Usage: assets <architect-slug>");
  const cfgPath = resolve("out", slug, "reel.json");
  if (!existsSync(cfgPath)) throw new Error(`No reel.json at ${cfgPath}. Run seed first.`);
  const cfg = JSON.parse(readFileSync(cfgPath, "utf8")) as ReelConfig;

  mkdirSync(PUBLIC_CAPTURE(slug), { recursive: true });
  for (const b of cfg.buildings) {
    process.stdout.write(`staging ${b.slug}…\n`);
    await stageBuilding(cfg.slug, b);
  }
  console.log(`done -> public/capture/${cfg.slug}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
