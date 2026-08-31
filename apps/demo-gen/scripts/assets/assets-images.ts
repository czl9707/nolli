import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { runCli, readJsonOr } from "@nolli/remotion/cli";
import { applyBrowserCaptureContext, waitForToastDisappear, LAUNCH_ARGS } from "./capture-helpers";
import type { Manifest } from "../seed/manifest";

const VIEWPORT = { width: 1920, height: 1080 };

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

// Capture BOTH types (detail + board lightbox) for every building of one slug
// into out/<slug>/images/. The base manifest (out/<slug>/manifest.json from
// `pnpm seed <slug>`) is read for the building list.
export async function generateImages(slug: string) {
  const outDir = resolve("out", slug);
  const manifest = readJsonOr<Manifest>(resolve("out", slug, "manifest.json"), "Run `pnpm seed <slug>` first.");
  if (!manifest.buildings?.length)
    throw new Error(`No buildings in manifest for ${slug}. Run \`pnpm seed ${slug}\` first.`);

  const imagesDir = join(outDir, "images");
  mkdirSync(imagesDir, { recursive: true });

  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  const detailImgs: string[] = [];
  const boardImgs: string[] = [];
  const failures: string[] = [];
  try {
    const context = await applyBrowserCaptureContext(browser, {
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const b of manifest.buildings) {
      try {
        // Detail view (?capture=1 enables WebGL readback for screenshots).
        await page.goto(`${BASE_URL}/arch/${b.slug}?capture=1`);
        await waitForToastDisappear(page);
        const detailRel = `images/${b.slug}-detail.png`;
        await page.screenshot({ path: join(outDir, detailRel), fullPage: false });
        detailImgs.push(detailRel);

        // Board view with the cover photo opened in the lightbox. Hash-proof
        // selectors carried over from the legacy capture.ts: polaroid wrappers
        // carry inline `transform: rotate(...)` (NOT rotateX/rotateZ like map
        // pins), and every BoardItem renders a pushpin <img src="/images/pin.png">
        // which must be excluded. A force-click is required: the board viewport
        // calls preventDefault() on pointerdown, which can swallow Playwright's
        // click.
        await page.goto(`${BASE_URL}/arch/${b.slug}/board?capture=1`);
        await waitForToastDisappear(page);
        const photo = page
          .locator('div[style*="rotate("] img:not([src*="pin.png"])')
          .first();
        await photo.click({ force: true });
        await page.locator('div[style*="aspect-ratio"]').waitFor({ state: "visible" });
        await page.waitForTimeout(600); // BoardModal fade-in
        const boardRel = `images/${b.slug}-board.png`;
        await page.screenshot({ path: join(outDir, boardRel), fullPage: false });
        boardImgs.push(boardRel);

        console.log(`  ${b.slug}: detail + board`);
      } catch (err) {
        failures.push(b.slug);
        console.error(`  ${b.slug}: FAILED — ${(err as Error).message}`);
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error(`\n${failures.length} building(s) failed: ${failures.join(", ")}`);
  }
  console.log(
    `Captured ${detailImgs.length} detail + ${boardImgs.length} board images → ${imagesDir}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  runCli("assets:images", async (slug) => {
    console.log(`assets:images — ${slug}`);
    await generateImages(slug);
  });
}
