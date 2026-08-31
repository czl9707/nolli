import { chromium } from "playwright";
import type { Locator } from "playwright";
import { join, resolve } from "node:path";
import { runCli, readJsonOr } from "@nolli/remotion/cli";
import { loadDemoConfig, type DemoConfig } from "../seed/demo-config";
import type { BuildingRow, Manifest } from "../seed/manifest";
import { LAUNCH_ARGS, waitForMapMoveEnd, BOARD_PHOTO, LIGHTBOX_BACKDROP } from "./capture-helpers";
import { createCursor, pointOf } from "./cursor";
import { startRecording, endRecording, resampleTimeline, muxClip, padHold, type MasterFrame } from "./recorder";
import { JOURNEY, setTuning, appWait, VIEWPORT } from "./tuning";
import {
  flyTo,
  navigateToArch,
  setupPageForCapture,
  panMapAround,
  warmTiles,
  flipSlowmo,
} from "./page-ops";

// Capture the journey→board→photo-open demo as a single slow-mo CDP screencast
// and resample it to a real-time 30fps clip (demo-1.mp4 in out/<slug>/). The
// journey comes from demo.json; tuning is code-only (demo-config.ts).
async function captureDemo(
  slug: string,
  buildings: BuildingRow[],
  config: DemoConfig,
): Promise<void> {
  const outDir = resolve("out", slug);
  setTuning(config.tuning);
  const [start] = buildings;
  const last = buildings[buildings.length - 1];

  const wallStart = Date.now();
  const beat = (label: string) =>
    console.log(`  demo+${((Date.now() - wallStart) / 1000).toFixed(2)}s ${label}`);

  let master: MasterFrame[] = [];
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  try {
    const { context, page } = await setupPageForCapture(browser, start);
    await warmTiles(page, start, last);
    await flipSlowmo(page);

    const cursor = createCursor(page, {
      slowmo: JOURNEY.slowmo,
      viewport: VIEWPORT,
      hoverAppMs: JOURNEY.cursorHoverAppMs,
      dwellAppMs: JOURNEY.cursorDwellAppMs,
    });

    const rec = await startRecording(context, page);
    await cursor.appear();

    // Cursor philosophy: STILL during camera beats (a frozen pointer over a
    // panning map reads as "watching"), then ONE decisive move + hover to each
    // thing it clicks. No aimless wandering — that's what read as "blind"
    // movement.
    const clickOn = async (target: Locator | { x: number; y: number }) => {
      const point = "x" in target ? target : await pointOf(target, VIEWPORT);
      await cursor.move(point, JOURNEY.cursorMoveAppMs);
      await cursor.click();
    };
    const beats: Array<() => Promise<void>> = [
      async () => {
        await appWait(page, JOURNEY.establishHold);
        await flyTo(page, start.latitude, start.longitude, JOURNEY.visitZoom);
        await waitForMapMoveEnd(page);
        await appWait(page, JOURNEY.flyHold);
        beat("beat1 done (ease-in + hold)");
      },
      async () => {
        await panMapAround(page, cursor, start);
        beat("pan#1 done");
      },
    ];
    for (const target of buildings.slice(1)) {
      beats.push(async () => {
        await navigateToArch(page, target, beat);
      });
      beats.push(async () => {
        await panMapAround(page, cursor, target);
        beat(`pan on ${target.slug} done`);
      });
    }
    beats.push(
      // Trust the app here: MapFlyNavigator's inset recenter on board entry IS
      // the shot — we do NOT flyTo ourselves. boardOpenSettle runs in wall time
      // (appMs / slowmo); raise it if pushing `slowmo` toward 1.0. boardHold is
      // a pure static pause that survives the final-cut 2× playbackRate.
      async () => {
        await clickOn(page.getByRole("button", { name: /go to pin board/i }));
        beat("board clicked");
        await appWait(page, JOURNEY.boardOpenSettle);
        beat("boardOpenSettle done");
        await appWait(page, JOURNEY.boardHold);
        beat("boardHold done");
      },
      // Final beat: open a photo (detail lightbox, cross-fade) and wait for the
      // entrance to actually finish — the settled hold is padded into the
      // recording afterwards (a static page emits no frames to record).
      async () => {
        const photo = page.locator(BOARD_PHOTO).first();
        await clickOn(photo);
        beat("photo clicked");
        // Playwright "visible" fires at mount — mid-fade, while the modal
        // backdrop is still at opacity ~0. The real entrance-done signal is the
        // backdrop (BoardModal's framer motion.div) reaching full opacity.
        // A timeout here means the click missed (the raw mouse.click doesn't
        // verify hit-targeting) — log it loudly instead of padding a board frame.
        const gateOk = await page
          .waitForFunction(
            (selector) => {
              const el = document.querySelector(selector);
              return !!el && Number(getComputedStyle(el).opacity) >= 0.999;
            },
            LIGHTBOX_BACKDROP,
            { timeout: 8000, polling: 120 },
          )
          .then(() => true)
          .catch(() => false);
        beat(gateOk ? "backdrop opacity 1" : "BACKDROP GATE TIMED OUT — lightbox never opened");
        // Let any trailing frames (inset-map repaints) land, then stop — the
        // hold itself is padHold below.
        await appWait(page, 300);
      },
    );

    for (const beatFn of beats) {
      await beatFn();
    }
    master = await endRecording(rec);
    padHold(master, JOURNEY.detailHold);
    beat("photo open — end of demo");
  } finally {
    await browser.close();
  }

  if (master.length < 30) {
    throw new Error(`Demo capture failed: only ${master.length} frames.`);
  }
  const clipAbs = await muxClip(outDir, resampleTimeline(master));
  console.log(`Wrote ${clipAbs}`);
}

export async function generateDemo(slug: string) {
  const outDir = resolve("out", slug);
  const manifest = readJsonOr<Manifest>(join(outDir, "manifest.json"), "Run `pnpm seed <slug>` first.");

  const config = loadDemoConfig(outDir);
  const buildings = config.journey.map((s) =>
    manifest.buildings.find((b) => b.slug === s),
  );
  const missing = config.journey.filter((_, i) => !buildings[i]);
  if (missing.length) {
    throw new Error(
      `demo.json journey slugs not in manifest: ${missing.join(", ")}. ` +
        `Edit the "journey" in out/${slug}/demo.json or rerun \`pnpm seed ${slug}\`.`,
    );
  }

  console.log(`assets:demo — ${slug} (journey: ${config.journey.join(" → ")})`);
  await captureDemo(slug, buildings as BuildingRow[], config);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  runCli("assets:demo", generateDemo);
}
