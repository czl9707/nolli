import type { BrowserContext, CDPSession, Page } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FPS } from "../../src/lib/constants";
import { JOURNEY, VIEWPORT } from "./tuning";

const execFileP = promisify(execFile);

// ── Recording + mux pipeline ────────────────────────────────────────────────
// startRecording opens a CDP screencast on the page; endRecording stops it and
// returns the frames folded onto the app-time clock. resampleTimeline →
// muxChunk then turn that frame list into demo-1.mp4.

type ScreencastFrame = { ts: number; data: string };
type Recorder = { client: CDPSession; frames: ScreencastFrame[]; ts0: number };
// One captured frame on the timeline: app-time (ms) since recording start.
export type MasterFrame = { appMs: number; data: string };

// Open a CDP screencast on the page. Frame times come from the compositor's
// own paint timestamp (metadata.timestamp, epoch seconds) — NOT arrival time:
// frames can arrive seconds late under load (e.g. the lightbox photo decode),
// and arrival-stamping smears the timeline, compressing late action into the
// clip's end.
export async function startRecording(context: BrowserContext, page: Page): Promise<Recorder> {
  const ts0 = Date.now() / 1000;
  const frames: ScreencastFrame[] = [];
  const client = await context.newCDPSession(page);
  client.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    frames.push({ ts: metadata.timestamp ?? Date.now() / 1000, data });
    await client.send("Page.screencastFrameAck", { sessionId });
  });
  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: JOURNEY.screencastQuality,
    maxWidth: VIEWPORT.width,
    maxHeight: VIEWPORT.height,
  });
  return { client, frames, ts0 };
}

// Stop the screencast, detach the CDP session, and fold the captured frames
// onto the app-time clock ((paintTime - recordingStart) * slowmo), in paint
// order.
export async function endRecording(rec: Recorder): Promise<MasterFrame[]> {
  await rec.client.send("Page.stopScreencast");
  await rec.client.detach().catch(() => {});
  const frames: MasterFrame[] = rec.frames
    .slice()
    .sort((a, b) => a.ts - b.ts)
    .map((f) => ({
      appMs: (f.ts - rec.ts0) * 1000 * JOURNEY.slowmo,
      data: f.data,
    }));
  console.log(`  recording committed (${frames.length} frames)`);
  return frames;
}

// A fully static page produces no compositor frames, so a wall-clock hold after
// the last visual change records nothing — the clip would end the instant the
// change settles. Materialize the hold as repeats of the last frame at output
// cadence (app-ms of hold).
export function padHold(master: MasterFrame[], appMs: number): void {
  const last = master[master.length - 1];
  const n = Math.round((appMs / 1000) * FPS);
  for (let i = 1; i <= n; i++) {
    master.push({ appMs: last.appMs + (i * 1000) / FPS, data: last.data });
  }
}

// Resample the recording's app-time frame timeline to a real-time 30fps frame list
// by nearest app-time. Pacing is 1:1 (the recording's app-time IS the real-time
// the viewer experiences); outCount is capped at maxFrames, beyond which pacing
// compresses. Runs once per recording.
export function resampleTimeline(master: MasterFrame[]): string[] {
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

// Write one chunk's resampled frames as a jpg sequence and mux to
// demo-<index>.mp4 (h264). Returns the absolute clip path.
export async function muxChunk(outDir: string, frames: string[], index: number): Promise<string> {
  const framesDir = join(outDir, `demo-frames-${index}`);
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  frames.forEach((d, i) => {
    writeFileSync(join(framesDir, `f${String(i).padStart(5, "0")}.jpg`), Buffer.from(d, "base64"));
  });

  const clipAbs = join(outDir, `demo-${index}.mp4`);
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
  return clipAbs;
}
