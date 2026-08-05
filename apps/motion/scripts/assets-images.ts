import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { newDarkContext, waitForStable, LAUNCH_ARGS } from "./capture-helpers";
import { seedPlaylist, mergePlaylist, type Playlist } from "./playlist";
import { farthestFrom } from "./geo";
import type { Manifest } from "./manifest";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

// Capture BOTH types (detail + board lightbox) for every building of one slug
// into out/<slug>/images/, then seed/refresh out/<slug>/video.json. The base
// manifest (out/<slug>/manifest.json from `pnpm manifest <slug>`) is read for
// the building list and left in place for `assemble` to consume.
async function captureImagesForSlug(slug: string) {
  const outDir = resolve("out", slug);
  const manifestPath = resolve("out", slug, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  if (!manifest.buildings?.length)
    throw new Error(`No buildings in manifest for ${slug}. Run \`pnpm manifest ${slug}\` first.`);

  const imagesDir = join(outDir, "images");
  mkdirSync(imagesDir, { recursive: true });

  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  const detailImgs: string[] = [];
  const boardImgs: string[] = [];
  const failures: string[] = [];
  try {
    const context = await newDarkContext(browser, {
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const b of manifest.buildings) {
      try {
        // Detail view (?capture=1 enables WebGL readback for screenshots).
        await page.goto(`${BASE_URL}/arch/${b.slug}?capture=1`);
        await waitForStable(page);
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
        await waitForStable(page);
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

  // Seed the journey targets (hero + farthest building) when first creating
  // video.json. On rerun, preserve a hand-edited journey — only fill it in if
  // missing. The morph reads these slugs; editing here pins the journey.
  const journey = { hero: manifest.hero, far: farthestFrom(manifest.buildings, manifest.hero).slug };

  const playlistPath = join(outDir, "video.json");
  let playlist: Playlist;
  if (existsSync(playlistPath)) {
    const existing = JSON.parse(readFileSync(playlistPath, "utf8")) as Partial<Playlist>;
    if (Array.isArray(existing.detail) && Array.isArray(existing.board)) {
      playlist = mergePlaylist(existing as Playlist, detailImgs, boardImgs);
      playlist.slug = slug; // keep slug in sync if rerun for a different slug in the same dir
      if (!playlist.journey) playlist.journey = journey;
    } else {
      // Stale old-shape video.json (pre-refactor `images[]`) — regenerate fresh.
      playlist = seedPlaylist(slug, detailImgs, boardImgs, journey);
    }
  } else {
    playlist = seedPlaylist(slug, detailImgs, boardImgs, journey);
  }
  writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
  console.log(
    `Wrote ${playlistPath} (${detailImgs.length + boardImgs.length} captured, ` +
      `${playlist.detail.length + playlist.board.length} listed, journey: ${playlist.journey.hero}→${playlist.journey.far})`,
  );
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: assets:images <architect-slug>");
    process.exit(1);
  }
  const manifestPath = resolve("out", slug, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}. Run \`pnpm --filter motion manifest ${slug}\` first.`);
  }
  console.log(`assets:images — ${slug}`);
  await captureImagesForSlug(slug);
}

main().catch((e) => { console.error(e); process.exit(1); });
