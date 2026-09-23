import { join } from "node:path";
import { readJsonOr } from "@nolli/remotion/cli";
import { FPS } from "../../src/lib/constants";

// Building slugs the demo visits, in order: open on the first, real-navigate
// through the middles, board + photo lightbox on the last.
export type Journey = string[];

// Canonical capture tuning. demo.json does NOT carry tuning — re-tuning is a
// code edit here. Values are app-ms (the units the final real-time clip shows).
export const DEFAULT_TUNING = {
  slowmo: 0.4,
  establishZoom: 10,
  // The zoom we visit buildings at: the opening dive and the nav-arrival warm-up.
  visitZoom: 14,
  // Post-landing settle before the arrival pan; the fly itself is gated by
  // waitForMapMoveEnd in the capture script.
  navLandMs: 1300,
  mapPanCount: 2,
  // boardOpenSettle absorbs the board morph-in + inset flyTo (a real setTimeout,
  // unscaled by slow-mo). boardHold is the pure static pause after it —
  // readable even after the final-cut 2× playbackRate. Together ~3.5s app.
  boardOpenSettle: 2000,
  boardHold: 1500,
  detailHold: 2000,

  // Look-around fan half-widths (deg): pan 1 OUT on a wide fan, pan 2 BACK on a
  // narrow one.
  panOutFanHalf: 60,
  panFanHalf: 20,
  panMagMin: 150,
  panMagMax: 400,
  panDurMin: 200,
  panDurMax: 400,
  panHold: 500,

  // Board look-around (panBoardAround): diagonal drag magnitude in px,
  // split 0.7/0.45 across x/y.
  boardPanMag: 480,
  boardPanDur: 400,
  boardPanHold: 400,

  // photoHold = lightbox on-screen time after its entrance; photoCloseSettle
  // absorbs the framer exit; mapReturnSettle covers the board→map morph.
  // boardPanToMag caps a pan-to-photo drag (panBoardTo).
  photoHold: 1000,
  photoCloseSettle: 400,
  mapReturnSettle: 1200,
  boardPanToMag: 480,

  screencastQuality: 96,
  maxFrames: 24 * FPS,

  // Visible-cursor feel (../assets/cursor.ts), app-ms like the rest: approach,
  // hover-on-target, post-release settle. Cursor only moves to click/drag.
  cursorMoveAppMs: 260,
  cursorHoverAppMs: 220,
  cursorDwellAppMs: 110,
} as const;

export type Tuning = typeof DEFAULT_TUNING;

// The on-disk file is just the journey; tuning is code-only.
export type DemoConfigFile = {
  journey: Journey;
};

export type DemoConfig = {
  journey: Journey;
  tuning: Tuning;
};

export function loadDemoConfig(dir: string): DemoConfig {
  const file = join(dir, "demo.json");
  const parsed = readJsonOr<Partial<DemoConfigFile>>(
    file,
    "Run `pnpm seed:architect <slug>` (or `seed:architecture`) first.",
  );
  if (!parsed.journey || parsed.journey.length < 1) {
    throw new Error(`${file} needs a journey of >=1 building slug.`);
  }
  return { journey: parsed.journey, tuning: DEFAULT_TUNING };
}
