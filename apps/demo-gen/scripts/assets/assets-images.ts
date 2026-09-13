import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { runCli, readJsonOr } from "@nolli/remotion/cli";
import {
  BASE_URL,
  BOARD_PHOTO,
  LIGHTBOX_FRAME,
  applyBrowserCaptureContext,
  waitForToastDisappear,
} from "./capture-helpers";
import { launchCaptureBrowser } from "./win-chrome";
import type { Manifest } from "../seed/manifest";
import { shotSrc, type ImagesConfigFile, type Shot } from "../seed/seed-common";
import { VIEWPORT, CAPTURE_SCALE } from "./tuning";

const SEED_HINT = "Run `pnpm seed:architect <slug>` (or `seed:architecture`) first.";

const shotLabel = (shot: Shot): string =>
  shot.type === "board" ? `${shot.building}-board-${shot.photo}` : `${shot.building}-detail`;

// Stills for every shot in out/<slug>/images.json → out/<slug>/images/.
// "detail" = the architecture page; "board" = the board view with the shot's
// n-th photo opened in the lightbox.
export async function generateImages(slug: string) {
  const outDir = resolve("out", slug);
  const { shots } = readJsonOr<ImagesConfigFile>(resolve("out", slug, "images.json"), SEED_HINT);
  if (!Array.isArray(shots)) throw new Error(`No "shots" list in out/${slug}/images.json.`);
  const manifest = readJsonOr<Manifest>(resolve("out", slug, "manifest.json"), SEED_HINT);
  const unknown = [
    ...new Set(shots.filter((s) => !manifest.buildings.some((b) => b.slug === s.building)).map((s) => s.building)),
  ];
  if (unknown.length) {
    throw new Error(
      `images.json shot building(s) not in manifest: ${unknown.join(", ")}. ` +
        `Edit the "shots" in out/${slug}/images.json or rerun the seed.`,
    );
  }

  const imagesDir = join(outDir, "images");
  mkdirSync(imagesDir, { recursive: true });

  const capture = await launchCaptureBrowser();
  let captured = 0;
  const failures: string[] = [];
  try {
    const context = await applyBrowserCaptureContext(capture.browser, {
      viewport: VIEWPORT,
      deviceScaleFactor: CAPTURE_SCALE,
    });
    const page = await context.newPage();

    for (const shot of shots) {
      try {
        if (shot.type === "detail") {
          // Detail view (?capture=1 enables WebGL readback for screenshots).
          await page.goto(`${BASE_URL}/arch/${shot.building}?capture=1`);
          await waitForToastDisappear(page);
        } else {
          // Board view with the shot's photo opened in the lightbox. A
          // force-click is required: the board viewport calls preventDefault()
          // on pointerdown, which can swallow Playwright's click.
          await page.goto(`${BASE_URL}/arch/${shot.building}/board?capture=1`);
          await waitForToastDisappear(page);
          await page.locator(BOARD_PHOTO).nth(shot.photo).click({ force: true });
          await page.locator(LIGHTBOX_FRAME).waitFor({ state: "visible" });
          await page.waitForTimeout(600); // BoardModal fade-in
        }
        const rel = shotSrc(shot);
        await page.screenshot({ path: join(outDir, rel), fullPage: false });
        captured++;
        console.log(`  ${shotLabel(shot)}`);
      } catch (err) {
        failures.push(shotLabel(shot));
        console.error(`  ${shotLabel(shot)}: FAILED — ${(err as Error).message}`);
      }
    }
  } finally {
    await capture.close();
  }

  if (failures.length) {
    console.error(`\n${failures.length} shot(s) failed: ${failures.join(", ")}`);
  }
  console.log(`Captured ${captured}/${shots.length} shots → ${imagesDir}`);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  runCli("assets:images", async (slug) => {
    console.log(`assets:images — ${slug}`);
    await generateImages(slug);
  });
}
