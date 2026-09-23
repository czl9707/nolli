import type { Locator } from "playwright";
import { join, resolve } from "node:path";
import { runCli, readJsonOr } from "@nolli/remotion/cli";
import { loadDemoConfig, type DemoConfig } from "../seed/demo-config";
import type { BuildingRow, Manifest } from "../seed/manifest";
import { launchCaptureBrowser } from "./win-chrome";
import {
  waitForMapMoveEnd,
  waitForTilesLoaded,
  BOARD_PHOTO,
  LIGHTBOX_BACKDROP,
} from "./capture-helpers";
import { createCursor, pointOf } from "./cursor";
import {
  startRecording,
  endRecording,
  resampleTimeline,
  muxClip,
  padHold,
  type MasterFrame,
} from "./recorder";
import { JOURNEY, setTuning, appWait, VIEWPORT } from "./tuning";
import { cam, setSlowmo, setupPageForCapture, panBoardTo, panBoardReset, panMapAround, flipSlowmo } from "./page-ops";

// Board-first demo narrative (demo-1.mp4 in out/<slug>/), for both seed modes
// (architecture + architect): open on the pin board (entrance plays pre-roll,
// unrecorded), walk the board's content, surface to the map, fly to a related
// architecture via a real "Also by" card click, look around, and close on the
// board morph-in. Slow-mo screencast → resample pipeline; the journey's first
// building is the subject, the fly target is picked at runtime from the
// sidebar suggestions.
async function captureDemoBoard(
  slug: string,
  buildings: BuildingRow[],
  config: DemoConfig,
): Promise<void> {
  const outDir = resolve("out", slug);
  setTuning(config.tuning);
  const [start] = buildings;

  const wallStart = Date.now();
  const beat = (label: string) =>
    console.log(`  demo+${((Date.now() - wallStart) / 1000).toFixed(2)}s ${label}`);

  let master: MasterFrame[] = [];
  const capture = await launchCaptureBrowser();
  try {
    // Open on the map route, then enter the board via the app's own button —
    // an in-app push, NOT a cold /board deep-link. The board's exit overlay
    // navigate(-1)s, and every full page load resets react-router's history
    // idx to 0, so a cold board link has no prior entry: its fallback
    // navigates to /arch/:slug WITHOUT ?capture=1 and the capture bridges
    // (window.__nolliMap) unmount for the rest of the session. The button
    // push keeps idx > 0 and carries the capture search, so back returns to
    // the capture URL. The morph-in + pin bloom + inset recenter all play
    // here, pre-roll — the recording starts on the settled board.
    const { context, page } = await setupPageForCapture(capture.browser, start);
    await page.getByRole("button", { name: /go to pin board/i }).click();
    const overlayText = page.getByText(/click to go back to map view/i);
    await overlayText.waitFor({ state: "visible", timeout: 12000 });
    const photoCount = await page.locator(BOARD_PHOTO).count();
    if (photoCount < 2) {
      throw new Error(`Board has ${photoCount} photos — need >=2 for the pan-to beats.`);
    }
    beat("board entrance settled (pre-roll)");
    // The inset map is already framed by the app's own board-entry flyTo; the
    // journey's only flight (the "Also by" click) is same-architect/nearby, so
    // its destination tiles stream during the slow-mo flight — no warm jumps,
    // which would wreck the inset framing we just waited for.
    const insetTiles = await waitForTilesLoaded(page, 6000);
    beat(insetTiles ? "inset tiles loaded" : "inset tiles TIMED OUT — recording anyway");
    await flipSlowmo(page);

    const cursor = createCursor(page, {
      slowmo: JOURNEY.slowmo,
      viewport: VIEWPORT,
      hoverAppMs: JOURNEY.cursorHoverAppMs,
      dwellAppMs: JOURNEY.cursorDwellAppMs,
    });

    const clickOn = async (target: Locator | { x: number; y: number }) => {
      const point = "x" in target ? target : await pointOf(target, VIEWPORT);
      await cursor.move(point, JOURNEY.cursorMoveAppMs);
      await cursor.click();
    };

    const rec = await startRecording(context, page);
    await cursor.appear();

    // Pick the two pan targets: the first photo, and whichever photo sits
    // farthest from it — a long second leg reads as "exploring", not "nudging".
    const photos = page.locator(BOARD_PHOTO);
    const boxes = await Promise.all(
      Array.from({ length: photoCount }, (_, i) => photos.nth(i).boundingBox()),
    );
    const a = 0;
    const aBox = boxes[a]!;
    let b = a;
    let bestDist = -1;
    for (const [i, box] of boxes.entries()) {
      if (!box) continue;
      const d = Math.hypot(box.x - aBox.x, box.y - aBox.y);
      if (d > bestDist) {
        bestDist = d;
        b = i;
      }
    }
    beat(`photos picked: #${a} → #${b} (Δ${Math.round(bestDist)}px)`);

    // Beat 1: pan to photo A, open it, hold, close.
    await panBoardTo(page, cursor, photos.nth(a));
    beat("pan-to A done");
    await clickOn(photos.nth(a));
    const openOk = await page
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
    beat(openOk ? "lightbox A open (backdrop opacity 1)" : "BACKDROP GATE TIMED OUT — lightbox never opened");
    await appWait(page, JOURNEY.photoHold);
    // Close on the backdrop's corner — well clear of the centered image frame.
    await clickOn({ x: VIEWPORT.width * 0.06, y: VIEWPORT.height * 0.06 });
    const closeOk = await page
      .waitForFunction(
        (selector) => {
          const el = document.querySelector(selector);
          return !el || Number(getComputedStyle(el).opacity) < 0.001;
        },
        LIGHTBOX_BACKDROP,
        { timeout: 8000, polling: 120 },
      )
      .then(() => true)
      .catch(() => false);
    beat(closeOk ? "lightbox A closed" : "CLOSE GATE TIMED OUT — lightbox never closed");
    await appWait(page, JOURNEY.photoCloseSettle);

    // Beat 2: pan to photo B — no open, the board has more to show.
    await panBoardTo(page, cursor, photos.nth(b));
    beat("pan-to B done");

    // Beat 3: surface to the map via the inset overlay (navigate(-1) morph).
    // panBoardReset first — a live pan at exit leaves the map view shifted
    // under the slowed clock — and the morph itself also runs at __SLOWMO=1:
    // framer never flushes the variant writes (surface transform, mapSlot
    // size/border) under the slowed clock, so the mapSlot would keep its
    // 10px board border and land smaller than home. Clip pacing is app-time
    // either way; only capture density during the ~0.5s morph drops.
    await panBoardReset(page, cursor);
    beat("board pan reset");
    await setSlowmo(page, 1);
    try {
      await clickOn(overlayText);
      await overlayText.waitFor({ state: "hidden", timeout: 8000 });
      await waitForMapMoveEnd(page);
      // Wall = app-ms at __SLOWMO=1 (appWait would scale by the journey's 0.4).
      await page.waitForTimeout(JOURNEY.mapReturnSettle);
    } finally {
      await setSlowmo(page, JOURNEY.slowmo);
    }
    beat("back on map view");

    // Beat 4: real "Also by" card click → the app's own inter-arch fly.
    await page.getByText(/^Also by /).first().waitFor({ state: "visible", timeout: 10000 });
    const cards = page.locator("[data-selected]");
    const cardCount = await cards.count();
    let clicked = false;
    for (let i = 0; i < cardCount && !clicked; i++) {
      const card = cards.nth(i);
      const alt = await card.locator("img").first().getAttribute("alt");
      if (!alt || alt === start.name) continue;
      await clickOn(card.locator("img").first());
      clicked = true;
      beat(`also-by card clicked → ${alt}`);
    }
    if (!clicked) throw new Error("No 'Also by' card found — nothing clickable besides the selection.");
    await waitForMapMoveEnd(page);
    await appWait(page, JOURNEY.navLandMs);
    const landed = await cam(page);
    beat(`fly landed (zoom ${landed?.zoom} lng ${landed?.lng.toFixed(3)})`);

    // Beat 5: look around the new pin.
    await panMapAround(page, cursor, {
      longitude: landed?.lng ?? start.longitude,
      latitude: landed?.lat ?? start.latitude,
    });
    beat("map pans done");

    // Beat 6: closing shot — the board morph-in, recorded this time. Runs at
    // __SLOWMO=1 like the exit: framer never flushes the entry morph's variant
    // writes under the slowed clock either — the mapSlot would keep its
    // borderless home styling and the final board would lose its white frame.
    await setSlowmo(page, 1);
    try {
      await clickOn(page.getByRole("button", { name: /go to pin board/i }));
      beat("board clicked");
      await page.waitForTimeout(JOURNEY.boardOpenSettle);
      beat("boardOpenSettle done");
    } finally {
      await setSlowmo(page, JOURNEY.slowmo);
    }

    master = await endRecording(rec);
    // The settled board is static (a static page emits no frames to record) —
    // its hold is padded into the timeline.
    padHold(master, JOURNEY.boardHold);
    beat("board open — end of demo");
  } finally {
    await capture.close();
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

  console.log(`assets:demo — ${slug} (board-first narrative)`);
  await captureDemoBoard(slug, buildings as BuildingRow[], config);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  runCli("assets:demo", generateDemo);
}
