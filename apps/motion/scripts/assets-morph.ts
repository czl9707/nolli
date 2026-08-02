import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { LAUNCH_ARGS, SLOWMO, newDarkContext, waitForStable, waitForMoveEnd, waitForTilesLoaded, appWait } from "./capture-helpers";
import { ARCHITECTS } from "./architects";
import type { Playlist } from "./playlist";
import type { Manifest } from "./manifest";
import { FPS, scene2Duration } from "../src/lib/timing";

const execFileP = promisify(execFile);
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

// ── B-roll camera tuning ──────────────────────────────────────────────────
// Drives the morph's opening sequence via the ?capture=1 map handle
// (window.__nolliMap). Every duration is in APP-ms — the units the final
// real-time clip shows (under SLOWMO, app time runs SLOWMO×wall, so an 800
// app-ms move takes 800/SLOWMO wall-ms and yields SLOWMO× more captured frames,
// then resamples back to real time). Tune the feel here; these are not per-run.
const BROLL = {
  // Opening zoom toward the centered hero pin. delta = zoom levels gained. The
  // eased duration is long in wall-time (app-ms / SLOWMO), which is what lets
  // the new zoom-level tiles load DURING the zoom — that load-during-move is the
  // real fix for the coarse-pattern-after-zoom artifact (areTilesLoaded() proved
  // unreliable under capture). `settle` is an app-ms rest after moveend for the
  // fade crossfade (~300ms) to finish before pans begin.
  zoom: { delta: [0.5, 0.9] as [number, number], duration: 800, settle: 500 },
  pan: {
    count: [2, 3] as [number, number], // number of pans
    distance: [70, 130] as [number, number], // per-pan screen-px magnitude
    duration: [600, 850] as [number, number], // app-ms per pan
    pause: [250, 400] as [number, number], // app-ms dwell after each pan
    driftX: 280, // max cumulative x offset (px) — keeps the pin on-screen
    driftY: 160, // max cumulative y offset (px)
  },
  moveTimeout: 6000, // max wall-ms for a camera move to reach moveend
} as const;

// Capture the home->board morph via slow-mo CDP screencast, resample to a
// real-time 30fps clip, and screenshot the morph's landing frame. Writes
// morph.mp4 + morph-end.png into out/<slug>/ and points video.json's `morph` at
// the clip so `assemble` renders Scene 2. See project memory for the slow-mo /
// WAAPI / b-roll rationale (this is the migrated captureMapMorph).
async function captureMorph(slug: string, manifest: Manifest): Promise<void> {
  const outDir = resolve("out", slug);
  const targetSeconds = scene2Duration / FPS; // matches Scene 2's window

  const frames: { wall: number; data: string }[] = [];
  let wall0 = 0;
  let clickWall = 0;

  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  try {
    const context = await newDarkContext(browser, {
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    // ?capture=1 does double duty here: preserveDrawingBuffer for the screencast
    // AND it gates MapCaptureBridge, which exposes window.__nolliMap — without it
    // the b-roll's easeTo/panBy calls are silent no-ops (the page just sits, then
    // morphs). waitForStable gives the bridge effect time to set the handle.
    await page.goto(`${BASE_URL}/arch/${manifest.hero}?capture=1`);
    await waitForStable(page);

    // Fail loudly if the map handle isn't exposed — every b-roll move is a no-op
    // without it (silent failure shows up as "no dragging, just sits then morphs").
    const hasMap = await page.evaluate(
      () => !!(window as unknown as { __nolliMap?: unknown }).__nolliMap,
    );
    if (!hasMap) {
      throw new Error(
        "window.__nolliMap not found — MapCaptureBridge didn't run. Is ?capture=1 present and the map loaded?",
      );
    }

    // Warm the b-roll target zoom's tiles OFF-CAMERA (before slow-mo + screencast),
    // so the recorded zoom finds them cached and snaps in instantly — matching a
    // live browser, where tiles are already cached. Without this the capture
    // shows a 2-3s coarse-then-fade as the new zoom-level tiles stream in. Runs at
    // real time (setTimeout isn't patched by the clock wrapper) and is invisible
    // (screencast hasn't started). Jumps to the max b-roll delta so the whole zoom
    // range's most-detailed tile level is cached, then restores the start view.
    const readZoom = () =>
      page.evaluate(
        () =>
          (window as unknown as { __nolliMap?: { getZoom: () => number } }).__nolliMap
            ?.getZoom() ?? 0,
      );
    const jumpTo = (z: number) =>
      page.evaluate(
        (zz: number) => {
          (window as unknown as { __nolliMap?: { jumpTo: (o: { zoom: number }) => void } })
            .__nolliMap?.jumpTo({ zoom: zz });
        },
        z,
      );
    const z0 = await readZoom();
    await jumpTo(z0 + BROLL.zoom.delta[1]);
    const targetOk = await waitForTilesLoaded(page, 6000);
    await jumpTo(z0);
    const startOk = await waitForTilesLoaded(page, 6000);
    console.log(`  tile warm: target ${targetOk ? "✓" : "cap"}, start ${startOk ? "✓" : "cap"}`);

    // Flip slow-mo AFTER settle so the initial DB/map load runs at real time.
    // The clock wrapper is installed before any page script via addInitScript.
    wall0 = Date.now();
    await page.evaluate(
      (s) => { (window as unknown as { __SLOWMO?: number }).__SLOWMO = s; },
      SLOWMO,
    );

    const client = await context.newCDPSession(page);
    client.on("Page.screencastFrame", async ({ data, sessionId }) => {
      frames.push({ wall: Date.now(), data });
      await client.send("Page.screencastFrameAck", { sessionId });
    });
    await client.send("Page.startScreencast", {
      format: "jpeg",
      quality: 92,
      maxWidth: 1920,
      maxHeight: 1080,
    });

    // B-roll: a short zoom toward the centered hero pin, then a few randomized
    // straight-line pans, then the morph. Driven through MapLibre's own camera
    // API (window.__nolliMap, exposed under ?capture=1) rather than synthetic
    // mouse events. Each eased move renders every frame (feeding the compositor
    // so the screencast never starves), and the zoom's long wall-duration lets
    // the new tiles load DURING the move — the fix for the coarse fill-pattern
    // that a fast wheel-zoom left behind. waitForMoveEnd sequences the moves
    // (easeTo returns before finishing); a short app-ms settle covers the fade.
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    // Opening zoom. easeTo with no `center` zooms around the viewport center,
    // where the hero pin already sits (the page flew to it on load).
    await page.evaluate(
      ({ d, dur }) => {
        const m = (window as unknown as {
          __nolliMap?: { getZoom: () => number; easeTo: (o: { zoom: number; duration: number }) => void };
        }).__nolliMap;
        m?.easeTo({ zoom: m.getZoom() + d, duration: dur });
      },
      { d: rand(BROLL.zoom.delta[0], BROLL.zoom.delta[1]), dur: BROLL.zoom.duration },
    );
    await waitForMoveEnd(page, BROLL.moveTimeout);
    await appWait(page, BROLL.zoom.settle);

    // Straight-line pans. Cumulative drift is clamped so the pin never sits far
    // on the side of the viewport (would mis-target the morph).
    const panCount = Math.round(rand(BROLL.pan.count[0], BROLL.pan.count[1] + 1));
    let ox = 0, oy = 0;
    for (let i = 0; i < panCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = rand(BROLL.pan.distance[0], BROLL.pan.distance[1]);
      const nx = clamp(ox + Math.cos(angle) * dist, -BROLL.pan.driftX, BROLL.pan.driftX);
      const ny = clamp(oy + Math.sin(angle) * dist, -BROLL.pan.driftY, BROLL.pan.driftY);
      const dx = nx - ox, dy = ny - oy;
      ox = nx; oy = ny;
      await page.evaluate(
        ({ dx, dy, dur }) => {
          const m = (window as unknown as {
            __nolliMap?: { panBy: (off: [number, number], o: { duration: number }) => void };
          }).__nolliMap;
          m?.panBy([dx, dy], { duration: dur });
        },
        { dx, dy, dur: Math.round(rand(BROLL.pan.duration[0], BROLL.pan.duration[1])) },
      );
      await waitForMoveEnd(page, BROLL.moveTimeout);
      await appWait(page, Math.round(rand(BROLL.pan.pause[0], BROLL.pan.pause[1])));
    }
    clickWall = Date.now();

    // Trigger the morph, then hold long enough for it to play out (kept short —
    // Chrome throttles the compositor on long idle captures).
    await page.getByRole("button", { name: /go to pin board/i }).click();
    await page.waitForTimeout(10000);

    await client.send("Page.stopScreencast");
  } finally {
    await browser.close();
  }
  if (frames.length < 30) throw new Error(`Morph capture failed: only ${frames.length} frames.`);

  // app-time of each captured frame = wall-elapsed * SLOWMO (seconds). Resample
  // to real-time 30fps by nearest app-time — every output frame is a genuine
  // sample, no blend ghosting.
  const appT = frames.map((f) => ((f.wall - wall0) * SLOWMO) / 1000);
  const clickApp = ((clickWall - wall0) * SLOWMO) / 1000;
  const tailApp = 2.5;
  const winStart = appT[0];
  const winEnd = Math.min(appT[appT.length - 1], clickApp + tailApp);
  const span = Math.max(1, winEnd - winStart);
  const outCount = Math.round(targetSeconds * FPS);
  const out: string[] = [];
  let j = 0;
  for (let k = 0; k < outCount; k++) {
    const target = winStart + (span * k) / (outCount - 1);
    while (j + 1 < appT.length && Math.abs(appT[j + 1] - target) <= Math.abs(appT[j] - target)) j++;
    out.push(frames[j].data);
  }
  console.log(`  morph at app-t ${clickApp.toFixed(2)}s, window ${winStart.toFixed(2)}–${winEnd.toFixed(2)}s`);
  console.log(`  morph: ${frames.length} captured -> ${outCount} real-time frames @${FPS}fps`);

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

  // End-still: the hero board page (the morph's landing frame), for Scene 2's
  // lock-frame handoff.
  const b2 = await chromium.launch({ args: LAUNCH_ARGS });
  try {
    const c2 = await newDarkContext(b2, { viewport: { width: 1920, height: 1080 } });
    const p2 = await c2.newPage();
    await p2.goto(`${BASE_URL}/arch/${manifest.hero}/board?capture=1`);
    await waitForStable(p2);
    await p2.screenshot({ path: join(outDir, "morph-end.png") });
  } finally {
    await b2.close();
  }

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
  if (!ARCHITECTS[slug]) {
    throw new Error(`Unknown architect slug "${slug}". Add it to ARCHITECTS in scripts/architects.ts.`);
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
