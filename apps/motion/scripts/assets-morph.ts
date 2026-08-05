import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { LAUNCH_ARGS, newDarkContext, waitForStable, waitForMoveEnd, waitForTilesLoaded } from "./capture-helpers";
import type { Playlist } from "./playlist";
import { loadPlaylist } from "./playlist";
import type { BuildingRow, Manifest } from "./manifest";
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
  slowmo: 0.4, // app-speed factor. Lower = more slow-mo (and more wall-time: appMs/slowmo). If a capture comes back with too few frames, RAISE this toward 0.5–0.7 (less wall-time) — Chrome starves the CDP screencast on long idle captures.
  establishZoom: 10, // opening mid-zoom on the hero (the camera starts here)
  diveZoom: 14, // ease-in target — the "lean in" before the look-around + arch hop
  establishHold: 1500, // hold on the opening mid view before easing in
  flyZoom: 14, // arch #2 flyTo destination (matches flyToArchCinematic default)
  flyHold: 1500, // hold after the ease-in
  navLandMs: 2100, // fixed wait after triggering the arch→arch nav — covers the off-screen fly (MAP_TRANSITION_LONG = 1800 app-ms) + a short settle, then straight into the #2 map pan. Replaces the old variable waitForMoveEnd + a dead hold.
  mapPanCount: 2, // map drift-pans while dwelling on each arch (the "look around")
  boardHold: 3000, // hold after the map->board morph settles
  detailHold: 2000, // hold on the open photo lightbox
  detailCloseHold: 500, // hold after closing the lightbox
  panCount: 2, // number of board drag-pans
  panDistance: 300, // shared pan magnitude (px) — map panBy AND board drag
  panDurationMs: 360, // shared pan SPEED: app-ms per pan glide (lower = faster). Map + board both use this.
  panSteps: 14, // board-drag smoothing increments per glide (map panBy is eased natively)
  panHold: 500, // app-ms hold between pans
  mapReturnMs: 3000, // wait after clicking back to the map — covers the framer-motion board→map morph + the flyTo settle, then the lock-frame still is the map view
  mapReturnHold: 1000, // hold on the arch #2 map view before cutting
  screencastQuality: 92,
  maxFrames: 24 * FPS, // resample ceiling (journey is now ~19-20s real-time)
} as const;

// Capture the home->board morph via slow-mo CDP screencast, resample to a
// real-time 30fps clip, and screenshot the morph's landing frame. Writes
// morph.mp4 + morph-end.png into out/<slug>/ and points video.json's `morph` at
// the clip so `assemble` renders Scene 2. See project memory for the slow-mo /
// WAAPI rationale (this is the migrated captureMapMorph).
async function captureMorph(
  slug: string,
  manifest: Manifest,
  hero: BuildingRow,
  far: BuildingRow,
): Promise<void> {
  const outDir = resolve("out", slug);

  if (manifest.buildings.length < 2) {
    throw new Error(`Journey needs >=2 buildings; ${slug} has ${manifest.buildings.length}.`);
  }

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
    for (const target of [
      { c: [hero.longitude, hero.latitude] as [number, number], z: JOURNEY.diveZoom },
      { c: [far.longitude, far.latitude] as [number, number], z: JOURNEY.flyZoom },
    ]) {
      await jumpTo(target.c, target.z);
      await waitForTilesLoaded(page, 6000);
    }
    // Open at the mid establishing zoom on the hero (the camera's start state).
    await jumpTo([hero.longitude, hero.latitude], JOURNEY.establishZoom);
    await waitForTilesLoaded(page, 6000);
    console.log("  tile warm done");

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

    // Wall-time beat timeline (Node clock is real; only the in-page clock is
    // slowed). Prints where capture time accumulates so dead segments are
    // obvious. app-time delta = wall delta * slowmo.
    const beat = (label: string) =>
      console.log(`  morph+${((Date.now() - wall0) / 1000).toFixed(2)}s ${label}`);
    const cam = () =>
      page.evaluate(() => {
        const m = (window as unknown as {
          __nolliMap?: { getZoom: () => number; getCenter: () => { lng: number; lat: number } };
        }).__nolliMap;
        if (!m) return null;
        const c = m.getCenter();
        return { zoom: m.getZoom(), lng: c.lng, lat: c.lat };
      });

    // In-page camera primitive mirroring packages/map/src/map-flyto.ts.
    const flyTo = (lat: number, lng: number, zoom: number = JOURNEY.flyZoom) =>
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
        { lat, lng, zoom },
      );

    // ── Map pan (look-around drift) ──────────────────────────────────────────
    // Mirrors the board pan's tuning (panDistance/panDurationMs/panHold) but via
    // the camera primitive panBy (eased), since the map has no useBoardPan. Reads
    // as a human "look around" while dwelling on an arch. Asserts each pan moved
    // (getCenter before/after) so a silent static drift fails loudly.
    const mapCenter = () =>
      page.evaluate(() => {
        const m = (window as unknown as { __nolliMap?: { getCenter: () => { lng: number; lat: number } } }).__nolliMap;
        const c = m?.getCenter();
        return c ? { lng: c.lng, lat: c.lat } : { lng: NaN, lat: NaN };
      });
    const panMap = (dx: number, dy: number) =>
      page.evaluate(
        ({ dx, dy, duration }) => {
          const m = (window as unknown as {
            __nolliMap?: { panBy: (off: [number, number], o: { duration: number }) => void };
          }).__nolliMap;
          m?.panBy([dx, dy], { duration });
        },
        { dx, dy, duration: JOURNEY.panDurationMs },
      );
    const panMapAround = async () => {
      for (let i = 0; i < JOURNEY.mapPanCount; i++) {
        const sign = i % 2 === 0 ? 1 : -1;
        const before = await mapCenter();
        await panMap(sign * JOURNEY.panDistance, sign * 60);
        await waitForMoveEnd(page);
        const after = await mapCenter();
        if (
          !Number.isNaN(before.lng) &&
          Math.abs(after.lng - before.lng) < 1e-6 &&
          Math.abs(after.lat - before.lat) < 1e-6
        ) {
          throw new Error("Map pan produced no movement — panBy didn't take.");
        }
        await appWait(page, JOURNEY.panHold);
      }
    };

    // ── Beat 1: open mid-zoom on the hero, hold, then ease in closer ──────
    await appWait(page, JOURNEY.establishHold);
    await flyTo(hero.latitude, hero.longitude, JOURNEY.diveZoom);
    await waitForMoveEnd(page);
    await appWait(page, JOURNEY.flyHold);
    beat("beat1 done (ease-in + hold)");

    // ── Beat 2: drift the map a couple times (a human "look around" on #1)
    await panMapAround();
    beat("pan#1 done");

    // ── Beat 3: real arch→arch navigation — the money shot. Same code path as
    // clicking an "Also by" suggestion card (window.__nolliNavigateArch, exposed
    // under ?capture=1): the URL changes, the sidebar (selection panel) updates
    // to arch #2, and MapFlyNavigator flies. Target is the farthest same-architect
    // building (warmed off-camera above) — reached via the real nav handler, not a
    // synthetic flyTo, so this is exactly the inter-arch transition a user gets.
    const hasNav = await page.evaluate(
      () => !!(window as unknown as { __nolliNavigateArch?: unknown }).__nolliNavigateArch,
    );
    if (!hasNav) {
      throw new Error("window.__nolliNavigateArch not found — ArchNavCaptureBridge didn't run.");
    }
    const camBeforeNav = await cam();
    beat(`nav trigger → ${far.slug} (from zoom ${camBeforeNav?.zoom} lng ${camBeforeNav?.lng.toFixed(3)})`);
    await page.evaluate(
      (slug) => {
        (window as unknown as { __nolliNavigateArch?: (s: string, fly?: boolean) => void }).__nolliNavigateArch?.(slug, true);
      },
      far.slug,
    );
    // Fixed wait for the off-screen fly (MAP_TRANSITION_LONG = 1800 app-ms) to land
    // + a short settle, then straight into the #2 map pan. Replaces a variable
    // waitForMoveEnd (which resolved unpredictably because `select` is async, so
    // isMoving() was already false at the first poll) plus a dead hold.
    await appWait(page, JOURNEY.navLandMs);
    const camAfterNav = await cam();
    beat(
      `navLandMs done (zoom ${camAfterNav?.zoom} lng ${camAfterNav?.lng.toFixed(3)}, ` +
        `Δlng ${((camAfterNav?.lng ?? 0) - (camBeforeNav?.lng ?? 0)).toFixed(3)})`,
    );

    // ── Beat 4: drift the map again on arch #2 before entering its board ──
    await panMapAround();
    beat("pan#2 done");

    // ── Beat 5: "Go to Pin Board" → map shrinks to inset, polaroids bloom ─
    await page.getByRole("button", { name: /go to pin board/i }).click();
    beat("board clicked");
    // The morph is framer-motion (map.isMoving() stays false) and the inset's
    // camera flyTo fires from a real-setTimeout (not slowed by the clock), so
    // waitForMoveEnd is a no-op here. boardHold must cover the morph + delayed
    // flyTo in WALL time (appMs / slowmo); keep boardHold generous if you raise
    // `slowmo` toward 1.0.
    await appWait(page, JOURNEY.boardHold);
    beat("boardHold done");

    // ── Beat 6: open a photo (detail lightbox, cross-fade) ────────────────
    const photo = page.locator('div[style*="rotate("] img:not([src*="pin.png"])').first();
    await photo.click({ force: true });
    await page.locator('div[style*="aspect-ratio"]').waitFor({ state: "visible" });
    await appWait(page, JOURNEY.detailHold);

    // ── Beat 7: close the lightbox (backdrop click → onClose) ─────────────
    // Click a corner that is backdrop, not the centered photo, then wait for the
    // modal to fully unmount (framer-motion exit fade ~0.6s app) before panning —
    // otherwise the still-present backdrop swallows the drag's pointerdown.
    await page.mouse.click(40, 40);
    await page
      .locator('div[style*="aspect-ratio"]')
      .waitFor({ state: "detached", timeout: 5000 })
      .catch(() => {});
    await appWait(page, JOURNEY.detailCloseHold);

    // ── Beat 8: pan the board a few times (pointer drag; wheel zooms, not pans)
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
    // render, which also yields a smooth glide under slow-mo. Glide speed is
    // panDurationMs (shared with the map pan); panSteps only sets smoothness.
    const stepDelay = JOURNEY.panDurationMs / JOURNEY.panSteps;
    for (let i = 0; i < JOURNEY.panCount; i++) {
      const sign = i % 2 === 0 ? 1 : -1;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await appWait(page, 150);
      for (let s = 1; s <= JOURNEY.panSteps; s++) {
        await page.mouse.move(
          cx + sign * JOURNEY.panDistance * (s / JOURNEY.panSteps),
          cy + sign * 60 * (s / JOURNEY.panSteps),
        );
        await appWait(page, stepDelay);
      }
      await page.mouse.up();
      await appWait(page, JOURNEY.panHold);
    }
    const xAfter = await polaroidX();
    if (!Number.isNaN(xBefore) && !Number.isNaN(xAfter) && Math.abs(xAfter - xBefore) < 2) {
      throw new Error("Board drag-pan produced no movement — synthetic pointer drag didn't take.");
    }
    beat("board pans done");

    // ── Beat 9: click the inset-map overlay to navigate back to the map view.
    // The overlay is the board's mini-map ("Click to go back to map view"); its
    // onClick does navigate(-1), which pops to the /arch/:slug?capture=1 map entry
    // (the board push dropped capture, but navigate(-1) restores the prior entry
    // that still has it). The board→map morph + the MapFlyNavigator flyTo run off
    // real setTimeouts (not slowed), so mapReturnMs is generous wall-time.
    await page.getByText(/click to go back to map view/i).click();
    await appWait(page, JOURNEY.mapReturnMs);
    beat("returned to map");

    // ── Hold on the map view so the journey lingers on arch #2 before cutting.
    await appWait(page, JOURNEY.mapReturnHold);

    // ── Stop, then grab the final map view of arch #2 as the lock-frame still
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
  const outDir = resolve("out", slug);
  const manifestPath = join(outDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath}. Run \`pnpm manifest ${slug}\` first.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

  // Journey targets come from video.json (seeded by assets:images, editable).
  const playlist = loadPlaylist(outDir);
  const { hero: heroSlug, far: farSlug } = playlist.journey;
  const hero = manifest.buildings.find((b) => b.slug === heroSlug);
  const far = manifest.buildings.find((b) => b.slug === farSlug);
  if (!hero || !far) {
    throw new Error(
      `video.json journey (${heroSlug}→${farSlug}) not found in manifest buildings. ` +
        `Edit the "journey" section in out/${slug}/video.json or rerun \`pnpm assets:images ${slug}\`.`,
    );
  }

  console.log(`assets:morph — ${slug} (journey: ${hero.slug} → ${far.slug})`);
  await captureMorph(slug, manifest, hero, far);
}

main().catch((e) => { console.error(e); process.exit(1); });
