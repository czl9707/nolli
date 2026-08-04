import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { LAUNCH_ARGS, newDarkContext, waitForStable, waitForMoveEnd, waitForTilesLoaded } from "./capture-helpers";
import { farthestFrom } from "./geo";
import type { Playlist } from "./playlist";
import type { Manifest } from "./manifest";
import { FPS } from "../src/lib/timing";

const execFileP = promisify(execFile);
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

// app-ms wait under the journey's slow-mo factor.
const appWait = (page: import("playwright").Page, appMs: number) =>
  page.waitForTimeout(appMs / JOURNEY.slowmo);

// ── Journey tuning ─────────────────────────────────────────────────────────
// All durations are APP-ms (the units the final real-time clip shows). Under
// `slowmo`, an app-ms wait takes appMs/slowmo wall-ms. Keep the sum of holds
// divided by `slowmo` under ~30s of wall-time — Chrome throttles the CDP
// screencast compositor on long idle captures and starves the frame stream.
const JOURNEY = {
  slowmo: 0.4, // app-speed factor; 0.4 (not the canonical 0.25) keeps this ~3x-longer journey's wall-time under the compositor-starvation threshold
  establishMaxZoom: 6, // fitBounds cap so single-city architects still pull back
  establishHold: 1200, // hold on the wide "all pins" establishing view
  flyZoom: 14, // destination zoom (matches flyToArchCinematic default)
  flyHold: 800, // hold after each flyTo lands
  boardHold: 1000, // hold after the map->board morph settles
  detailHold: 1000, // hold on the open photo lightbox
  detailCloseHold: 400, // hold after closing the lightbox
  panCount: 3, // number of board drag-pans
  panDistance: 260, // drag magnitude (px)
  panHold: 500, // hold between pans
  screencastQuality: 92,
  maxFrames: 18 * FPS, // resample ceiling (18s real-time; journey is ~15s)
} as const;

// Capture the home->board morph via slow-mo CDP screencast, resample to a
// real-time 30fps clip, and screenshot the morph's landing frame. Writes
// morph.mp4 + morph-end.png into out/<slug>/ and points video.json's `morph` at
// the clip so `assemble` renders Scene 2. See project memory for the slow-mo /
// WAAPI rationale (this is the migrated captureMapMorph).
async function captureMorph(slug: string, manifest: Manifest): Promise<void> {
  const outDir = resolve("out", slug);

  const buildings = manifest.buildings;
  if (buildings.length < 2) {
    throw new Error(`Journey needs >=2 buildings; ${slug} has ${buildings.length}.`);
  }
  const hero = buildings.find((b) => b.slug === manifest.hero) ?? buildings[0];
  const far = farthestFrom(buildings, manifest.hero);
  // MapLibre's LngLatBounds only honors [0]=SW,[1]=NE (NaNs at exactly 4 points),
  // so reduce to a true bounding box before fitBounds.
  const bounds: [[number, number], [number, number]] = buildings.reduce(
    (acc, b) => [
      [Math.min(acc[0][0], b.longitude), Math.min(acc[0][1], b.latitude)],
      [Math.max(acc[1][0], b.longitude), Math.max(acc[1][1], b.latitude)],
    ],
    [
      [buildings[0].longitude, buildings[0].latitude],
      [buildings[0].longitude, buildings[0].latitude],
    ] as [[number, number], [number, number]],
  );

  const frames: { wall: number; data: string }[] = [];
  let wall0 = 0;

  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  try {
    const context = await newDarkContext(browser, {
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    // ?capture=1: preserveDrawingBuffer for the screencast AND gates
    // MapCaptureBridge, which exposes window.__nolliMap.
    await page.goto(`${BASE_URL}/arch/${manifest.hero}?capture=1`);
    await waitForStable(page);

    const hasMap = await page.evaluate(
      () => !!(window as unknown as { __nolliMap?: unknown }).__nolliMap,
    );
    if (!hasMap) {
      throw new Error(
        "window.__nolliMap not found — MapCaptureBridge didn't run. Is ?capture=1 present and the map loaded?",
      );
    }

    // ── Off-camera tile warm-up ───────────────────────────────────────────
    // Warm both flyTo destinations' zoom level at their centers BEFORE slow-mo,
    // so each swoop snaps in instantly during capture. Jumps run at real time
    // (setTimeout isn't patched) and are invisible (screencast hasn't started).
    const jumpTo = (center: [number, number], zoom: number) =>
      page.evaluate(
        ({ center, zoom }) => {
          (window as unknown as {
            __nolliMap?: { jumpTo: (o: { center: [number, number]; zoom: number }) => void };
          }).__nolliMap?.jumpTo({ center, zoom });
        },
        { center, zoom },
      );
    const startZoom = await page.evaluate(
      () => (window as unknown as { __nolliMap?: { getZoom: () => number } }).__nolliMap?.getZoom() ?? 14,
    );
    for (const target of [
      [hero.longitude, hero.latitude],
      [far.longitude, far.latitude],
    ] as [number, number][]) {
      await jumpTo(target, JOURNEY.flyZoom);
      await waitForTilesLoaded(page, 6000);
    }
    await jumpTo([hero.longitude, hero.latitude], startZoom);
    await waitForTilesLoaded(page, 6000);
    console.log("  tile warm: hero + far destination warmed");

    // ── Flip slow-mo, then start the screencast ───────────────────────────
    wall0 = Date.now();
    await page.evaluate(
      (s) => {
        (window as unknown as { __SLOWMO?: number }).__SLOWMO = s;
      },
      JOURNEY.slowmo,
    );

    const client = await context.newCDPSession(page);
    client.on("Page.screencastFrame", async ({ data, sessionId }) => {
      frames.push({ wall: Date.now(), data });
      await client.send("Page.screencastFrameAck", { sessionId });
    });
    await client.send("Page.startScreencast", {
      format: "jpeg",
      quality: JOURNEY.screencastQuality,
      maxWidth: 1920,
      maxHeight: 1080,
    });

    // In-page camera primitives mirroring packages/map/src/map-flyto.ts.
    const fitAll = () =>
      page.evaluate(
        ({ bounds, maxZoom }) => {
          (window as unknown as {
            __nolliMap?: { fitBounds: (b: [[number, number], [number, number]], o: { padding: number; maxZoom: number }) => void };
          }).__nolliMap?.fitBounds(bounds, { padding: 120, maxZoom });
        },
        { bounds, maxZoom: JOURNEY.establishMaxZoom },
      );
    const flyTo = (lat: number, lng: number) =>
      page.evaluate(
        ({ lat, lng, zoom }) => {
          const m = (window as unknown as {
            __nolliMap?: {
              getZoom: () => number;
              getBounds: () => { contains: (p: [number, number]) => boolean };
              stop: () => void;
              flyTo: (o: {
                center: [number, number];
                zoom: number;
                duration: number;
                curve: number;
                speed: number;
                essential: boolean;
              }) => void;
            };
          }).__nolliMap;
          if (!m) return;
          const dest = Math.max(m.getZoom(), zoom);
          const delta = dest - m.getZoom();
          const contains = m.getBounds().contains([lng, lat]);
          const duration = contains ? 600 + delta * 200 : 1800;
          m.stop();
          m.flyTo({ center: [lng, lat], zoom: dest, duration, curve: 1.2, speed: 1.0, essential: true });
        },
        { lat, lng, zoom: JOURNEY.flyZoom },
      );

    // ── Beat 1: establishing wide view of all pins ────────────────────────
    await fitAll();
    await waitForMoveEnd(page);
    await appWait(page, JOURNEY.establishHold);

    // ── Beat 2: fly to hero ───────────────────────────────────────────────
    await flyTo(hero.latitude, hero.longitude);
    await waitForMoveEnd(page);
    await appWait(page, JOURNEY.flyHold);

    // ── Beat 3: fly to the farthest building (the money shot) ─────────────
    await flyTo(far.latitude, far.longitude);
    await waitForMoveEnd(page);
    await appWait(page, JOURNEY.flyHold);

    // ── Beat 4: "Go to Pin Board" → map shrinks to inset, polaroids bloom ─
    await page.getByRole("button", { name: /go to pin board/i }).click();
    // The morph is framer-motion (map.isMoving() stays false) and the inset's
    // camera flyTo fires from a real-setTimeout (not slowed by the clock), so
    // waitForMoveEnd is a no-op here. boardHold must cover the morph + delayed
    // flyTo in WALL time (appMs / slowmo); keep boardHold generous if you raise
    // `slowmo` toward 1.0.
    await appWait(page, JOURNEY.boardHold);

    // ── Beat 5: open a photo (detail lightbox, cross-fade) ────────────────
    const photo = page.locator('div[style*="rotate("] img:not([src*="pin.png"])').first();
    await photo.click({ force: true });
    await page.locator('div[style*="aspect-ratio"]').waitFor({ state: "visible" });
    await appWait(page, JOURNEY.detailHold);

    // ── Beat 6: close the lightbox (backdrop click → onClose) ─────────────
    // Click a corner that is backdrop, not the centered photo, then wait for the
    // modal to fully unmount (framer-motion exit fade ~0.6s app) before panning —
    // otherwise the still-present backdrop swallows the drag's pointerdown.
    await page.mouse.click(40, 40);
    await page
      .locator('div[style*="aspect-ratio"]')
      .waitFor({ state: "detached", timeout: 5000 })
      .catch(() => {});
    await appWait(page, JOURNEY.detailCloseHold);

    // ── Beat 7: pan the board a few times (pointer drag; wheel zooms, not pans)
    const cx = 960;
    const cy = 540;
    const polaroidX = () =>
      page.evaluate(
        () =>
          (document.querySelector('div[style*="rotate("]') as HTMLElement | null)?.getBoundingClientRect()
            .left ?? NaN,
      );
    const xBefore = await polaroidX();
    // useBoardPan gates pointermove on isPanning, which is set in pointerdown via
    // a React state update. Playwright's batched mouse.move steps can all land
    // before React commits isPanning=true (every move returns early → no pan), so
    // settle after down() and move in spaced increments — each gets its own
    // render, which also yields a smooth glide under slow-mo.
    const panSteps = 14;
    for (let i = 0; i < JOURNEY.panCount; i++) {
      const sign = i % 2 === 0 ? 1 : -1;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await appWait(page, 150);
      for (let s = 1; s <= panSteps; s++) {
        await page.mouse.move(
          cx + sign * JOURNEY.panDistance * (s / panSteps),
          cy + sign * 60 * (s / panSteps),
        );
        await appWait(page, 30);
      }
      await page.mouse.up();
      await appWait(page, JOURNEY.panHold);
    }
    const xAfter = await polaroidX();
    if (!Number.isNaN(xBefore) && !Number.isNaN(xAfter) && Math.abs(xAfter - xBefore) < 2) {
      throw new Error("Board drag-pan produced no movement — synthetic pointer drag didn't take.");
    }

    // ── Beat 8: stop, then grab the final panned board as the lock-frame still
    await client.send("Page.stopScreencast");
    await page.screenshot({ path: join(outDir, "morph-end.png") });
  } finally {
    await browser.close();
  }
  if (frames.length < 60) throw new Error(`Morph capture failed: only ${frames.length} frames.`);

  // app-time of each captured frame = wall-elapsed * slowmo (seconds). Resample
  // the FULL journey window to real-time 30fps by nearest app-time — pacing is
  // 1:1 because the journey's app-time IS the real-time the viewer experiences
  // (capped at `maxFrames`; beyond that the cap compresses pacing).
  const appT = frames.map((f) => ((f.wall - wall0) * JOURNEY.slowmo) / 1000);
  const winStart = appT[0];
  const winEnd = appT[appT.length - 1];
  const span = Math.max(1, winEnd - winStart);
  const outCount = Math.min(Math.round(span * FPS), JOURNEY.maxFrames);
  const out: string[] = [];
  let j = 0;
  for (let k = 0; k < outCount; k++) {
    const target = winStart + (span * k) / (outCount - 1);
    while (j + 1 < appT.length && Math.abs(appT[j + 1] - target) <= Math.abs(appT[j] - target)) j++;
    out.push(frames[j].data);
  }
  console.log(`  journey: ${frames.length} captured -> ${outCount} real-time frames (${span.toFixed(1)}s @${FPS}fps)`);

  const framesDir = join(outDir, "morph-frames");
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  out.forEach((d, i) => {
    writeFileSync(join(framesDir, `f${String(i).padStart(5, "0")}.jpg`), Buffer.from(d, "base64"));
  });

  const clipAbs = join(outDir, "morph.mp4");
  rmSync(clipAbs, { force: true });
  await execFileP("ffmpeg", [
    "-y",
    "-framerate", String(FPS),
    "-pattern_type", "sequence",
    "-i", join(framesDir, "f%05d.jpg"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-an",
    clipAbs,
  ]);
  rmSync(framesDir, { recursive: true, force: true });

  // Point the playlist at the clip so `assemble` renders Scene 2.
  const playlistPath = join(outDir, "video.json");
  const playlist = JSON.parse(readFileSync(playlistPath, "utf8")) as Playlist;
  playlist.morph = "morph.mp4";
  writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
  console.log(`Wrote ${clipAbs} + morph-end.png; set morph in ${playlistPath}`);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: assets:morph <architect-slug>");
    process.exit(1);
  }
  const manifestPath = resolve("out", slug, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}. Run \`pnpm manifest ${slug}\` first.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  console.log(`assets:morph — ${slug} (hero: ${manifest.hero})`);
  await captureMorph(slug, manifest);
}

main().catch((e) => { console.error(e); process.exit(1); });
