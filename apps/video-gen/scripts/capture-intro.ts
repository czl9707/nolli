import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { runCli } from "./runCli";
import { dataDir } from "./paths";
import type { ReelConfig } from "../src/lib/config";

const BASE_URL = process.env.BASE_URL ?? "https://nolli-map.com";
const COUNT = Number(process.env.INTRO_COUNT ?? 5);

// Board lightbox screenshots (app at BASE_URL, dark theme) for the reel's INTRO
// beat. Buildings are taken in reel order — the first COUNT get captured.
async function captureBoardImages(slug: string) {
  const cfg = JSON.parse(
    readFileSync(join(dataDir(slug), "reel.json"), "utf8"),
  ) as ReelConfig;
  const buildings = cfg.buildings.slice(0, COUNT);
  const imagesDir = join(dataDir(slug), "images");
  mkdirSync(imagesDir, { recursive: true });

  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader-webgl", "--force-color-profile=srgb"],
  });
  const failures: string[] = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      colorScheme: "dark",
    });
    // Theme store reads localStorage('theme') before first paint.
    await context.addInitScript(`try { localStorage.setItem('theme', 'dark'); } catch (e) {}`);
    const page = await context.newPage();

    for (const [i, b] of buildings.entries()) {
      try {
        await page.goto(`${BASE_URL}/arch/${b.slug}/board`);
        await waitForStable(page);
        // Polaroid wrappers carry inline transform rotate() (map pins don't);
        // every BoardItem renders a pushpin <img> which must be excluded.
        // force-click: the board viewport preventDefaults pointerdown.
        const photo = page
          .locator('div[style*="rotate("] img:not([src*="pin.png"])')
          .first();
        await photo.click({ force: true });
        await page.locator('div[style*="aspect-ratio"]').waitFor({ state: "visible" });
        await page.waitForTimeout(600); // BoardModal fade-in

        const png = await page.screenshot({ type: "png" });
        const outPath = resolve(imagesDir, `intro-${i + 1}.jpg`);
        await sharp(png).jpeg({ quality: 82 }).toFile(outPath);
        console.log(`  ${b.slug} -> ${outPath}`);
      } catch (err) {
        failures.push(b.slug);
        console.error(`  ${b.slug}: FAILED — ${(err as Error).message}`);
      }
    }
  } finally {
    await browser.close();
  }
  if (failures.length) throw new Error(`Failed: ${failures.join(", ")}`);
}

async function waitForStable(page: import("playwright").Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => (document as Document).fonts.ready);
  await page
    .locator(".maplibregl-marker")
    .first()
    .waitFor({ state: "attached", timeout: 8000 })
    .catch(() => {});
  // Let the sonner toast auto-dismiss before shooting.
  const toast = page.locator("[data-sonner-toast]");
  if (await toast.count()) {
    await toast.waitFor({ state: "hidden", timeout: 6000 }).catch(() => {});
  }
  await page.waitForTimeout(Number(process.env.SETTLE_MS ?? 2500));
}

runCli("capture:intro", captureBoardImages);
