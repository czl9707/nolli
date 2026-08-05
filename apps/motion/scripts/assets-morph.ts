import { chromium } from "playwright";
import type { Browser, BrowserContext, CDPSession, Page } from "playwright";
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
const appWait = (page: Page, appMs: number) =>
  page.waitForTimeout(appMs / JOURNEY.slowmo);

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;

// A fully random drift-pan (random direction + magnitude in range). Used for
// board drag-pans, where there's no pin to frame.
const randomPan = (): { dx: number; dy: number; dur: number } => {
  const angle = Math.random() * Math.PI * 2;
  const mag = rand(JOURNEY.panMagMin, JOURNEY.panMagMax);
  return {
    dx: Math.round(Math.cos(angle) * mag),
    dy: Math.round(Math.sin(angle) * mag),
    dur: Math.round(rand(JOURNEY.panDurMin, JOURNEY.panDurMax)),
  };
};

const VIEWPORT_CX = 960;
const VIEWPORT_CY = 540;

// Project an arch's coord to screen px via the live map (to aim the return pan).
const pinScreen = (page: Page, lng: number, lat: number) =>
  page.evaluate(
    ({ lng, lat }) => {
      const m = (window as unknown as {
        __nolliMap?: { project?: (lngLat: [number, number]) => { x: number; y: number } };
      }).__nolliMap;
      const p = m?.project?.([lng, lat]);
      return p ? { x: p.x, y: p.y } : null;
    },
    { lng, lat },
  );

// Build a pan (dx, dy, dur) from a base angle + a ±fanHalf spread, with random
// magnitude/duration. Used by the map look-around: pan 1 glances OUT away from
// the pin (wide fan), pan 2 glances BACK toward the pin (narrow fan).
const panFromAngle = (base: number, fanHalfDeg: number): { dx: number; dy: number; dur: number } => {
  const angle = base + (Math.random() - 0.5) * 2 * ((fanHalfDeg * Math.PI) / 180);
  const mag = rand(JOURNEY.panMagMin, JOURNEY.panMagMax);
  return {
    dx: Math.round(Math.cos(angle) * mag),
    dy: Math.round(Math.sin(angle) * mag),
    dur: Math.round(rand(JOURNEY.panDurMin, JOURNEY.panDurMax)),
  };
};

// ── Journey tuning ─────────────────────────────────────────────────────────
// All durations are APP-ms (the units the final real-time clip shows). Under
// `slowmo`, an app-ms wait takes appMs/slowmo wall-ms. Keep the sum of holds
// divided by `slowmo` under ~30s of wall-time PER CHUNK — Chrome throttles the
// CDP screencast compositor on long idle captures and starves the frame stream.
// The journey is now recorded as two chunks (map journey, then board section),
// so each chunk's continuous screencast is half as long.
const JOURNEY = {
  slowmo: 0.4, // app-speed factor. Lower = more slow-mo (and more wall-time: appMs/slowmo). If a capture comes back with too few frames, RAISE this toward 0.5–0.7 (less wall-time) — Chrome starves the CDP screencast on long idle captures.
  establishZoom: 10, // opening mid-zoom on the hero (the camera starts here)
  diveZoom: 14, // ease-in target — the "lean in" before the look-around + arch hop
  establishHold: 1000, // hold on the opening mid view before easing in
  flyZoom: 14, // arch #2 flyTo destination (matches flyToArchCinematic default)
  flyHold: 1500, // hold after the ease-in
  navLandMs: 2100, // fixed wait after triggering the arch→arch nav — covers the off-screen fly (MAP_TRANSITION_LONG = 1800 app-ms) + a short settle, then straight into the #2 map pan. Replaces the old variable waitForMoveEnd + a dead hold.
  mapPanCount: 2, // map drift-pans while dwelling on each arch (the "look around")
  boardHold: 3000, // hold after the map->board morph settles
  detailHold: 2000, // hold on the open photo lightbox
  detailCloseHold: 500, // hold after closing the lightbox

  panCount: 2, // number of board drag-pans
  panFanHalf: 20, // half-angle (deg) of the return fan around the line back to the pin → 40° fan
  panMagMin: 150, // min pan magnitude in px (a gentle glance, not a fling)
  panMagMax: 400, // max pan magnitude in px (keeps the pin comfortably in view)
  panDurMin: 200, // min glide duration in app-ms
  panDurMax: 400, // max glide duration in app-ms
  panSteps: 14, // board-drag smoothing increments per glide (map panBy is eased natively)
  panHold: 500, // app-ms hold between pans

  mapReturnMs: 3000, // wait after clicking back to the map — covers the framer-motion board→map morph + the flyTo settle, then the lock-frame still is the map view
  mapReturnHold: 1000, // hold on the arch #2 map view before cutting
  screencastQuality: 92,
  maxFrames: 24 * FPS, // resample ceiling — hard cap on output frames; raise if a longer journey legitimately truncates
} as const;

// ── Recording primitives ───────────────────────────────────────────────────
// startRecording / endRecording fold a CDP screencast into a Recorder; Journey
// owns the timeline and exposes start/seam/end so the journey can be captured
// as N sequential chunks. The seam is a single seam() call — move it to
// relocate where one chunk ends and the next begins. The commit keeps the final
// timeline continuous (app-time), so an unrecorded gap between two chunks just
// reads as a hard cut.

type ScreencastFrame = { wall: number; data: string };
type Recorder = { client: CDPSession; frames: ScreencastFrame[]; wall0: number };
// Master timeline frame: app-time (ms) the viewer experiences, already offset
// across chunks into one continuous timeline.
type MasterFrame = { appMs: number; data: string };

// Open a CDP screencast on the page. Each Recorder owns its own session + wall
// clock origin, so chunks can be started/stopped independently.
async function startRecording(context: BrowserContext, page: Page): Promise<Recorder> {
  const wall0 = Date.now();
  const frames: ScreencastFrame[] = [];
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
  return { client, frames, wall0 };
}

// Stop a recorder's screencast and detach its CDP session.
async function endRecording(rec: Recorder): Promise<void> {
  await rec.client.send("Page.stopScreencast");
  await rec.client.detach().catch(() => {});
}

// Fold a finished chunk's frames onto the master timeline, offset onto the tail
// of whatever prior chunks already appended. Frames keep their intra-chunk
// pacing (wall - wall0) * slowmo and land end-to-end with prior chunks;
// anything not recorded between chunks is simply absent → hard cut.
function commitChunk(master: MasterFrame[], rec: Recorder): void {
  const offset = master.length ? master[master.length - 1].appMs : 0;
  for (const f of rec.frames) {
    master.push({ appMs: (f.wall - rec.wall0) * JOURNEY.slowmo + offset, data: f.data });
  }
}

// Owns the master timeline + the currently-recording chunk. Chunks auto-number
// for logging; the caller only places start/seam/end around the beats. Adding a
// chunk = adding one seam() call + its beats — no per-chunk locals or cursor
// bookkeeping at the call site.
class Journey {
  private master: MasterFrame[] = [];
  private current: Recorder | null = null;
  private chunkNo = 0;
  constructor(private context: BrowserContext, private page: Page, private beat: (label: string) => void) {}

  /** Begin recording chunk 1. */
  async start(): Promise<void> {
    await this.begin();
  }

  /** End the current chunk and begin the next — this call IS the seam. */
  async seam(): Promise<void> {
    await this.finish();
    await this.begin();
  }

  /** End the final chunk (no restart). */
  async end(): Promise<void> {
    await this.finish();
    this.current = null;
  }

  /** The committed, continuous app-time frame timeline across all chunks. */
  frames(): MasterFrame[] {
    return this.master;
  }

  private async begin(): Promise<void> {
    this.chunkNo++;
    this.current = await startRecording(this.context, this.page);
  }

  private async finish(): Promise<void> {
    const rec = this.current;
    if (!rec) throw new Error("Journey: no active recording to finish");
    await endRecording(rec);
    const n = rec.frames.length;
    commitChunk(this.master, rec);
    this.beat(`chunk ${this.chunkNo} committed (${n} frames)`);
  }
}

// ── In-page camera + gesture primitives ────────────────────────────────────
// In-page camera primitive mirroring packages/map/src/map-flyto.ts.
const flyTo = (page: Page, lat: number, lng: number, zoom: number = JOURNEY.flyZoom) =>
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

const cam = (page: Page) =>
  page.evaluate(() => {
    const m = (window as unknown as {
      __nolliMap?: { getZoom: () => number; getCenter: () => { lng: number; lat: number } };
    }).__nolliMap;
    if (!m) return null;
    const c = m.getCenter();
    return { zoom: m.getZoom(), lng: c.lng, lat: c.lat };
  });

const mapCenter = (page: Page) =>
  page.evaluate(() => {
    const m = (window as unknown as { __nolliMap?: { getCenter: () => { lng: number; lat: number } } }).__nolliMap;
    const c = m?.getCenter();
    return c ? { lng: c.lng, lat: c.lat } : { lng: NaN, lat: NaN };
  });

// Map drift-pan (camera panBy, eased natively). Reads as a human "look around"
// while dwelling on an arch. Asserts movement so a silent static drift fails.
const panMap = (page: Page, dx: number, dy: number, dur: number) =>
  page.evaluate(
    ({ dx, dy, duration }) => {
      const m = (window as unknown as {
        __nolliMap?: { panBy: (off: [number, number], o: { duration: number }) => void };
      }).__nolliMap;
      m?.panBy([dx, dy], { duration });
    },
    { dx, dy, duration: dur },
  );

// `mapPanCount` "look around" pans around the target pin — a human out-and-back
// glance. Pan 1 glances OUT, away from the pin (wide fan → "some direction" but
// reliably outward); pan 2 glances BACK toward the pin within a narrow fan. The
// pin's home is offset from viewport center (the selection panel shifts the map's
// effective center), so "away from the pin" on pan 1 is what guarantees the two
// pans differ — aiming pan 1 at the pin would send both the same way. Asserts
// per-pan movement (getCenter before/after) so a silent no-op pan fails.
async function panMapAround(page: Page, target: { longitude: number; latitude: number }) {
  for (let i = 0; i < JOURNEY.mapPanCount; i++) {
    const pin = await pinScreen(page, target.longitude, target.latitude);
    let p: { dx: number; dy: number; dur: number };
    let intent: string;
    if (!pin) {
      p = randomPan();
      intent = "random (pin unavailable)";
    } else {
      const offX = pin.x - VIEWPORT_CX;
      const offY = pin.y - VIEWPORT_CY;
      if (Math.hypot(offX, offY) < 8) {
        p = randomPan();
        intent = "random (pin centered)";
      } else if (i === 0) {
        // Pan 1: glance OUT away from the pin — wide (±60°) fan so the outbound
        // direction varies run-to-run instead of mirroring the return axis.
        p = panFromAngle(Math.atan2(-offY, -offX), 60);
        intent = "OUT away from pin";
      } else {
        p = panFromAngle(Math.atan2(offY, offX), JOURNEY.panFanHalf); // toward pin
        intent = "BACK toward pin";
      }
      console.log(
        `    pin off=(${signed(Math.round(offX))},${signed(Math.round(offY))}) → ${intent}`,
      );
    }
    const before = await mapCenter(page);
    console.log(
      `    map pan ${i + 1}/${JOURNEY.mapPanCount} dx=${signed(p.dx)} dy=${signed(p.dy)}` +
        ` (center=${before.lng.toFixed(3)},${before.lat.toFixed(3)})`,
    );
    await panMap(page, p.dx, p.dy, p.dur);
    await waitForMoveEnd(page);
    const after = await mapCenter(page);
    if (
      !Number.isNaN(before.lng) &&
      Math.abs(after.lng - before.lng) < 1e-6 &&
      Math.abs(after.lat - before.lat) < 1e-6
    ) {
      throw new Error("Map pan produced no movement — panBy didn't take.");
    }
    await appWait(page, JOURNEY.panHold);
  }
}

// Board drag-pan (pointer drag; wheel zooms, not pans). useBoardPan gates
// pointermove on isPanning, set in pointerdown via a React state update.
// Playwright's batched mouse.move steps can all land before React commits
// isPanning=true (every move returns early → no pan), so settle after down()
// and move in spaced increments — each gets its own render, which also yields a
// smooth glide under slow-mo. Asserts PER pan — varied directions can net ~zero
// over the whole loop, so a net-displacement check would false-throw.
async function panBoard(page: Page, p: { dx: number; dy: number; dur: number }) {
  const cx = 960;
  const cy = 540;
  const polaroidPos = () =>
    page.evaluate(() => {
      const r = (document.querySelector('div[style*="rotate("]') as HTMLElement | null)?.getBoundingClientRect();
      return r ? { left: r.left, top: r.top } : { left: NaN, top: NaN };
    });
  const start = await polaroidPos();
  const stepDelay = p.dur / JOURNEY.panSteps;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await appWait(page, 150);
  for (let s = 1; s <= JOURNEY.panSteps; s++) {
    await page.mouse.move(
      cx + p.dx * (s / JOURNEY.panSteps),
      cy + p.dy * (s / JOURNEY.panSteps),
    );
    await appWait(page, stepDelay);
  }
  await page.mouse.up();
  await appWait(page, JOURNEY.panHold);
  const end = await polaroidPos();
  if (
    !Number.isNaN(start.left) &&
    !Number.isNaN(end.left) &&
    Math.hypot(end.left - start.left, end.top - start.top) < 2
  ) {
    throw new Error("Board drag-pan produced no movement — synthetic pointer drag didn't take.");
  }
}

// ── Capture phases ──────────────────────────────────────────────────────────
// Each phase of the journey capture is its own helper; captureMorph is just the
// sequencer. The recording beats stay inline (they ARE the cinematic narrative)
// while the mechanics — page setup, tile warm-up, nav internals, resample, mux
// — live behind named functions.

// Open the dark-mode capture page on the hero arch and assert the map bridge
// exposed itself (?capture=1 gates MapCaptureBridge → window.__nolliMap, and
// preserves the drawing buffer for the screencast).
async function openCapturePage(browser: Browser, hero: BuildingRow) {
  const context = await newDarkContext(browser, {
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/arch/${hero.slug}?capture=1`);
  await waitForStable(page);
  const hasMap = await page.evaluate(
    () => !!(window as unknown as { __nolliMap?: unknown }).__nolliMap,
  );
  if (!hasMap) {
    throw new Error(
      "window.__nolliMap not found — MapCaptureBridge didn't run. Is ?capture=1 present and the map loaded?",
    );
  }
  return { context, page };
}

// Warm both flyTo destinations' zoom at their centers BEFORE slow-mo, so each
// swoop snaps in instantly during capture. Jumps run at real time (setTimeout
// isn't patched) and are invisible (screencast hasn't started). Leaves the
// camera at the establishing zoom on the hero (the journey's start state).
async function warmTiles(page: Page, hero: BuildingRow, far: BuildingRow) {
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
  await jumpTo([hero.longitude, hero.latitude], JOURNEY.establishZoom);
  await waitForTilesLoaded(page, 6000);
  console.log("  tile warm done");
}

// Flip the whole app (MapLibre camera + framer-motion) into slow-mo for capture.
async function flipSlowmo(page: Page) {
  await page.evaluate(
    (s) => {
      (window as unknown as { __SLOWMO?: number }).__SLOWMO = s;
    },
    JOURNEY.slowmo,
  );
}

// Beat 3: real arch→arch navigation — the money shot. Same code path as clicking
// an "Also by" suggestion card (window.__nolliNavigateArch, exposed under
// ?capture=1): the URL changes, the sidebar (selection panel) updates to arch #2,
// and MapFlyNavigator flies. Target is the farthest same-architect building
// (warmed off-camera above) — reached via the real nav handler, not a synthetic
// flyTo, so this is exactly the inter-arch transition a user gets.
async function navigateToArch(page: Page, far: BuildingRow, beat: (label: string) => void) {
  const hasNav = await page.evaluate(
    () => !!(window as unknown as { __nolliNavigateArch?: unknown }).__nolliNavigateArch,
  );
  if (!hasNav) {
    throw new Error("window.__nolliNavigateArch not found — ArchNavCaptureBridge didn't run.");
  }
  const camBeforeNav = await cam(page);
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
  const camAfterNav = await cam(page);
  beat(
    `navLandMs done (zoom ${camAfterNav?.zoom} lng ${camAfterNav?.lng.toFixed(3)}, ` +
      `Δlng ${((camAfterNav?.lng ?? 0) - (camBeforeNav?.lng ?? 0)).toFixed(3)})`,
  );
}

// Resample the continuous app-time frame timeline to a real-time 30fps frame
// list by nearest app-time. Pacing is 1:1 (the journey's app-time IS the
// real-time the viewer experiences); outCount is capped at maxFrames, beyond
// which pacing compresses. Chunks concat cleanly because commitChunk already
// offset them onto one timeline.
function resampleTimeline(master: MasterFrame[]): string[] {
  const winStart = master[0].appMs;
  const winEnd = master[master.length - 1].appMs;
  const span = Math.max(1, winEnd - winStart);
  const outCount = Math.min(Math.round((span / 1000) * FPS), JOURNEY.maxFrames);
  const out: string[] = [];
  let j = 0;
  for (let k = 0; k < outCount; k++) {
    const target = winStart + (span * k) / (outCount - 1);
    while (j + 1 < master.length && Math.abs(master[j + 1].appMs - target) <= Math.abs(master[j].appMs - target)) j++;
    out.push(master[j].data);
  }
  console.log(`  journey: ${master.length} captured -> ${outCount} real-time frames (${(span / 1000).toFixed(1)}s @${FPS}fps)`);
  return out;
}

// Write the resampled frames as a jpg sequence and mux to morph.mp4 (h264), then
// point video.json's `morph` at the clip so `assemble` renders Scene 2.
async function muxClip(outDir: string, frames: string[]): Promise<void> {
  const framesDir = join(outDir, "morph-frames");
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  frames.forEach((d, i) => {
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

  const playlistPath = join(outDir, "video.json");
  const playlist = JSON.parse(readFileSync(playlistPath, "utf8")) as Playlist;
  playlist.morph = "morph.mp4";
  writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
  console.log(`Wrote ${clipAbs}; set morph in ${playlistPath}`);
}

// Capture the home->board morph via slow-mo CDP screencast, resample to a
// real-time 30fps clip, and screenshot the morph's landing frame. Writes
// morph.mp4 + morph-end.png into out/<slug>/ and points video.json's `morph` at
// the clip so `assemble` renders Scene 2. See project memory for the slow-mo /
// WAAPI rationale (this is the migrated captureMapMorph).
//
// Recorded as TWO chunks (map journey, then board section) joined by a single
// seam() call — move that call to relocate the cut; add another seam() anywhere
// for 3+ chunks. Default seam: right before entering the board (Beat 5).
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

  // Capture-wide wall clock for beat logging only (per-chunk app-time uses each
  // recorder's own wall0).
  const wallStart = Date.now();
  const beat = (label: string) =>
    console.log(`  morph+${((Date.now() - wallStart) / 1000).toFixed(2)}s ${label}`);

  let journey!: Journey;
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  try {
    const { context, page } = await openCapturePage(browser, hero);
    await warmTiles(page, hero, far);
    await flipSlowmo(page);

    // ══ CHUNK 1 — the map journey (beats 1–4) ════════════════════════════
    journey = new Journey(context, page, beat);
    await journey.start();

    // Beat 1: open mid-zoom on the hero, hold, then ease in closer.
    await appWait(page, JOURNEY.establishHold);
    await flyTo(page, hero.latitude, hero.longitude, JOURNEY.diveZoom);
    await waitForMoveEnd(page);
    await appWait(page, JOURNEY.flyHold);
    beat("beat1 done (ease-in + hold)");

    // Beat 2: drift the map a couple times (a human "look around" on #1).
    await panMapAround(page, hero);
    beat("pan#1 done");

    // Beat 3: arch→arch navigation (the money shot).
    await navigateToArch(page, far, beat);

    // Beat 4: drift the map again on arch #2 before entering its board.
    await panMapAround(page, far);
    beat("pan#2 done");

    // ── SEAM (default): end the map-journey chunk here, before the board.
    // This single seam() call IS the cut — move it to relocate where chunk 1
    // ends and chunk 2 begins. Add another seam() anywhere to make 3+ chunks.
    await journey.seam();

    // ══ CHUNK 2 — the board section (beats 5–9) ══════════════════════════
    // Beat 5: "Go to Pin Board" → map shrinks to inset, polaroids bloom.
    await page.getByRole("button", { name: /go to pin board/i }).click();
    beat("board clicked");
    // The morph is framer-motion (map.isMoving() stays false) and the inset's
    // camera flyTo fires from a real-setTimeout (not slowed by the clock), so
    // waitForMoveEnd is a no-op here. boardHold must cover the morph + delayed
    // flyTo in WALL time (appMs / slowmo); keep boardHold generous if you raise
    // `slowmo` toward 1.0.
    await appWait(page, JOURNEY.boardHold);
    beat("boardHold done");

    // Beat 6: open a photo (detail lightbox, cross-fade).
    const photo = page.locator('div[style*="rotate("] img:not([src*="pin.png"])').first();
    await photo.click({ force: true });
    await page.locator('div[style*="aspect-ratio"]').waitFor({ state: "visible" });
    await appWait(page, JOURNEY.detailHold);

    // Beat 7: close the lightbox (backdrop click → onClose). Click a corner that
    // is backdrop, not the centered photo, then wait for the modal to fully
    // unmount (framer-motion exit fade ~0.6s app) before panning — otherwise the
    // still-present backdrop swallows the drag's pointerdown.
    await page.mouse.click(40, 40);
    await page
      .locator('div[style*="aspect-ratio"]')
      .waitFor({ state: "detached", timeout: 5000 })
      .catch(() => {});
    await appWait(page, JOURNEY.detailCloseHold);

    // Beat 8: pan the board a few times (pointer drag; wheel zooms, not pans).
    for (let i = 0; i < JOURNEY.panCount; i++) {
      await panBoard(page, randomPan());
    }
    beat("board pans done");

    // Beat 9: click the inset-map overlay to navigate back to the map view. Its
    // onClick does navigate(-1), which pops to the /arch/:slug?capture=1 map entry
    // (the board push dropped capture, but navigate(-1) restores the prior entry
    // that still has it). The board→map morph + the MapFlyNavigator flyTo run off
    // real setTimeouts (not slowed), so mapReturnMs is generous wall-time.
    await page.getByText(/click to go back to map view/i).click();
    await appWait(page, JOURNEY.mapReturnMs);
    beat("returned to map");

    // Hold on the map view so the journey lingers on arch #2 before cutting.
    await appWait(page, JOURNEY.mapReturnHold);

    await journey.end();
    // Grab the final map view of arch #2 as the lock-frame still.
    await page.screenshot({ path: join(outDir, "morph-end.png") });
  } finally {
    await browser.close();
  }

  const master = journey.frames();
  if (master.length < 60) throw new Error(`Morph capture failed: only ${master.length} frames.`);
  const frames = resampleTimeline(master);
  await muxClip(outDir, frames);
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
