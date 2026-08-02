import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { LAUNCH_ARGS, SLOWMO, newDarkContext, waitForStable, slowDrag } from "./capture-helpers";
import { ARCHITECTS } from "./architects";
import type { Playlist } from "./playlist";
import type { Manifest } from "./manifest";
import { FPS, scene2Duration } from "../src/lib/timing";

const execFileP = promisify(execFile);
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

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
    await page.goto(`${BASE_URL}/arch/${manifest.hero}`);
    await waitForStable(page);

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

    // B-roll: zoom toward the centered pin FIRST (the page flew to it on load),
    // then a few short randomized drag-pans, then the morph. slowDrag keeps the
    // compositor fed (long idle settles starve the screencast).
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const mapBox = await page.locator(".maplibregl-map").first().boundingBox();
    const mcx = mapBox ? mapBox.x + mapBox.width / 2 : 1295;
    const mcy = mapBox ? mapBox.y + mapBox.height / 2 : 540;

    await page.mouse.move(mcx, mcy);
    await page.mouse.wheel(0, -rand(280, 440));
    await page.waitForTimeout(600);

    const dragCount = 3 + Math.floor(Math.random() * 2); // 3 or 4 pans
    let cx = mcx, cy = mcy;
    for (let i = 0; i < dragCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = rand(80, 150);
      const ex = clamp(cx + Math.cos(angle) * dist, mcx - 320, mcx + 320);
      const ey = clamp(cy + Math.sin(angle) * dist, mcy - 180, mcy + 180);
      await slowDrag(page, cx, cy, ex, ey);
      cx = ex; cy = ey;
      await page.waitForTimeout(rand(180, 360));
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
