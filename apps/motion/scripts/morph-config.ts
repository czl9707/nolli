import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FPS } from "../src/lib/timing";

export type Journey = { hero: string; far: string };

export const SEAM_AFTER_BEAT_DEFAULT = 4;

// Canonical capture tuning. Values moved verbatim from the JOURNEY const in
// scripts/assets-morph.ts; Task 6 retargets assets-morph to consume this module.
export const DEFAULT_TUNING = {
  slowmo: 0.4,
  establishZoom: 10,
  diveZoom: 14,
  establishHold: 1000,
  flyZoom: 14,
  flyHold: 1500,
  navLandMs: 2100,
  mapPanCount: 2,
  boardHold: 3000,
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

export type MorphConfig = {
  journey: Journey;
  seamAfterBeat: number;
  tuning: Tuning;
};

export function loadMorphConfig(dir: string): MorphConfig {
  const file = join(dir, "morph.json");
  if (!existsSync(file)) {
    throw new Error(`No morph.json at ${file}. Run \`pnpm seed <slug>\` first.`);
  }
  const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<MorphConfig>;
  if (!parsed.journey) throw new Error(`${file} is missing journey.hero/far.`);
  return {
    journey: parsed.journey,
    seamAfterBeat: parsed.seamAfterBeat ?? SEAM_AFTER_BEAT_DEFAULT,
    tuning: { ...DEFAULT_TUNING, ...parsed.tuning },
  };
}
