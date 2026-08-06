import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FPS } from "../src/lib/timing";

export type Journey = { hero: string; far: string };

// Seam fires after beat 5 = the "Go to Pin Board" open + hold. That makes chunk 1
// (demo-1, the only chunk the default video.json uses) end on the board reveal.
export const SEAM_AFTER_BEAT_DEFAULT = 5;

// Canonical capture tuning. demo.json does NOT carry tuning — re-tuning is a
// code edit here. Values are app-ms (the units the final real-time clip shows).
export const DEFAULT_TUNING = {
  slowmo: 0.4,
  establishZoom: 10,
  diveZoom: 14,
  establishHold: 1000,
  flyZoom: 14,
  flyHold: 1500,
  navLandMs: 2100,
  mapPanCount: 2,
  // Beat 5 is split: boardOpenSettle absorbs the "Go to Pin Board" morph-in
  // (framer-motion) + the inset camera flyTo (a real setTimeout, unscaled by
  // slow-mo, so it lands in app-time faster than its delay suggests). boardHold
  // is then a PURE static pause after the bloom finishes — readable even after
  // the final-cut 2× playbackRate. Together ~3.5s app.
  boardOpenSettle: 2000,
  boardHold: 1500,
  detailHold: 2000,
  detailCloseHold: 500,

  panCount: 2,
  panFanHalf: 20,
  panMagMin: 150,
  panMagMax: 400,
  panDurMin: 200,
  panDurMax: 400,
  panSteps: 14,
  panHold: 500,

  mapReturnMs: 3000,
  mapReturnHold: 1000,
  screencastQuality: 92,
  maxFrames: 24 * FPS,
} as const;

export type Tuning = typeof DEFAULT_TUNING;

// The on-disk file is just the two slugs + the seam; tuning is code-only.
export type DemoConfigFile = {
  journey: Journey;
  seamAfterBeat?: number;
};

export type DemoConfig = {
  journey: Journey;
  seamAfterBeat: number;
  tuning: Tuning;
};

export function loadDemoConfig(dir: string): DemoConfig {
  const file = join(dir, "demo.json");
  if (!existsSync(file)) {
    throw new Error(`No demo.json at ${file}. Run \`pnpm seed <slug>\` first.`);
  }
  const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<DemoConfigFile>;
  if (!parsed.journey) throw new Error(`${file} is missing journey.hero/far.`);
  return {
    journey: parsed.journey,
    seamAfterBeat: parsed.seamAfterBeat ?? SEAM_AFTER_BEAT_DEFAULT,
    tuning: DEFAULT_TUNING,
  };
}
