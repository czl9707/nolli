import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { rename } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve, join } from "node:path";
import type { Manifest } from "./manifest";
import { FPS, scene2Duration } from "../src/lib/timing";

const execFileP = promisify(execFile);
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
const SETTLE_MS = Number(process.env.SETTLE_MS ?? 1500);

async function trimToLastSeconds(file: string, seconds: number) {
  const tmp = file + ".trim.webm";
  await execFileP("ffmpeg", [
    "-y",
    "-sseof",
    "-" + String(seconds),
    "-i",
    file,
    "-t",
    String(seconds),
    "-c:v",
    "libvpx",
    "-b:v",
    "1M",
    "-an",
    tmp,
  ]);
  await rename(tmp, file);
}

async function waitForStable(page: import("playwright").Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => (document as Document).fonts.ready);
  await page.waitForTimeout(SETTLE_MS);
}

async function captureStills(slug: string, manifest: Manifest) {
  const dir = resolve("public/capture", slug);
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader-webgl"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const stills: { path: string }[] = [];

  // First batch: detail views for the first 5 buildings. (capture=1 enables WebGL readback)
  const firstBatch = manifest.buildings.slice(0, 5);
  for (const b of firstBatch) {
    await page.goto(`${BASE_URL}/arch/${b.slug}?capture=1`);
    await waitForStable(page);
    const path = `capture/${slug}/${b.slug}-detail.png`;
    await page.screenshot({ path: join("public", path), fullPage: false });
    stills.push({ path });
  }

  // Second batch: board views for 4 buildings (variant B).
  const secondBatch = manifest.buildings.slice(5, 9);
  for (const b of secondBatch) {
    await page.goto(`${BASE_URL}/arch/${b.slug}/board?capture=1`);
    await waitForStable(page);
    const path = `capture/${slug}/${b.slug}-board.png`;
    await page.screenshot({ path: join("public", path), fullPage: false });
    stills.push({ path });
  }

  await browser.close();
  return stills;
}

async function captureMapMorph(slug: string, manifest: Manifest): Promise<string | null> {
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader-webgl"] });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: { dir: resolve("public/capture", slug), size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  // Start in detail mode for the hero building (capture=1 so WebGL reads back).
  await page.goto(`${BASE_URL}/arch/${manifest.hero}?capture=1`);
  await waitForStable(page);

  // B-roll: a couple of canvas interactions (pan + zoom) on the map.
  // (Skip canvas.hover(): the maplibre wrapper div intercepts pointer events;
  // page.mouse.* drives absolute coords directly and works fine.)
  await page.mouse.move(960, 540);
  await page.mouse.down();
  await page.mouse.move(1100, 500, { steps: 12 });
  await page.mouse.up();
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(900);

  // Trigger the real home->board morph via the in-app button.
  await page.getByRole("button", { name: /go to pin board/i }).click();
  // Let the framer-motion morph play out (TRANSITION_LONG ~1.2s) + settle.
  await page.waitForTimeout(3000);

  const video = page.video();
  const webmPath = await video?.path();
  await browser.close();
  return webmPath ?? null;
}

async function main() {
  const slug = process.argv[2] ?? "sanaa";
  const manifestPath = resolve("public/capture", slug, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

  const stills = await captureStills(slug, manifest);
  const webmPath = await captureMapMorph(slug, manifest);
  manifest.stills = stills;

  const clipRel = `capture/${slug}/map-morph.webm`;
  // End-still: reopen at the hero board URL, screenshot.
  const b2 = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader-webgl"] });
  const p2 = await b2.newPage({ viewport: { width: 1920, height: 1080 } });
  await p2.goto(`${BASE_URL}/arch/${manifest.hero}/board?capture=1`);
  await waitForStable(p2);
  manifest.mapClipEnd = `capture/${slug}/map-morph-end.png`;
  await p2.screenshot({ path: join("public", manifest.mapClipEnd) });
  await b2.close();

  if (webmPath) {
    await rename(webmPath, join("public", clipRel));
    await trimToLastSeconds(join("public", clipRel), scene2Duration / FPS);
    manifest.mapClip = clipRel;
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Captured ${stills.length} stills + map-morph clip for ${slug}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
