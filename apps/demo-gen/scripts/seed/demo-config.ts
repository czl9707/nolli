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
  // The "Also by" fly is gated by waitForMapMoveEnd in the capture script;
  // this is the pure post-landing settle before the arrival pan starts.
  navLandMs: 1300,
  mapPanCount: 2,
  // boardOpenSettle absorbs the "Go to Pin Board" morph-in (framer-motion) +
  // the inset camera flyTo (a real setTimeout, unscaled by slow-mo, so it lands
  // in app-time faster than its delay suggests). boardHold is then a PURE
  // static pause after the bloom finishes — readable even after the final-cut
  // 2× playbackRate. Together ~3.5s app.
  boardOpenSettle: 2000,
  boardHold: 1500,
  // Final beat: held after the lightbox entrance fully settles — the clip ends here.
  detailHold: 2000,

  // Look-around fan half-widths (deg): pan 1 glances OUT away from the pin on a
  // wide fan; pan 2 glances BACK toward the pin on a narrow one.
  panOutFanHalf: 60,
  panFanHalf: 20,
  panMagMin: 150,
  panMagMax: 400,
  panDurMin: 200,
  panDurMax: 400,
  panHold: 500,

  // Board look-around (see page-ops' panBoardAround). boardPanMag is the drag's
  // diagonal magnitude in px; the drag splits it 0.7/0.45 across x/y.
  boardPanMag: 480,
  boardPanDur: 400,
  boardPanHold: 400,

  // Board-first narrative (assets-demo-board.ts). photoHold is the lightbox's
  // on-screen time after its entrance settles; photoCloseSettle absorbs the
  // framer exit before the next board pan. mapReturnSettle covers the
  // board→map morph (mapSlot resize + sidebar reopen). boardPanToMag caps a
  // pan-to-photo drag (see page-ops' panBoardTo).
  photoHold: 1000,
  photoCloseSettle: 400,
  mapReturnSettle: 1200,
  boardPanToMag: 480,

  screencastQuality: 96,
  maxFrames: 24 * FPS,

  // Visible-cursor feel (see ../assets/cursor.ts). app-ms, like the rest. The
  // approach to a click target, the hover-on-target before pressing (the "I'm
  // here" beat), and the post-release settle. Cursor is still during camera
  // beats and only moves to deliberately click/drag — visual tuning.
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
