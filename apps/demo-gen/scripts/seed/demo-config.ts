import { join } from "node:path";
import { readJsonOr } from "@nolli/remotion/cli";
import { MAP_TRANSITION_LONG } from "@nolli/ui/constants";
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
  establishHold: 1000,
  flyHold: 400,
  // The nav flyTo itself runs at @nolli/ui's MAP_TRANSITION_LONG (app-ms) +
  // a short settle before the arrival pan — derived so it tracks the constant
  // instead of freezing it (page-ops' flyTo already reads the live value).
  navLandMs: MAP_TRANSITION_LONG * 1000 + 300,
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

  screencastQuality: 92,
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
  const parsed = readJsonOr<Partial<DemoConfigFile>>(file, "Run `pnpm seed <slug>` first.");
  if (!parsed.journey || parsed.journey.length < 2) {
    throw new Error(
      `${file} needs a journey of >=2 building slugs (open on the first, navigate to the rest).`,
    );
  }
  return { journey: parsed.journey, tuning: DEFAULT_TUNING };
}
