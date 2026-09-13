import type { Page } from "playwright";
import type { Tuning } from "../seed/demo-config";
import { VIDEO } from "../../src/lib/constants";

// ── Journey tuning ─────────────────────────────────────────────────────────
// All durations are APP-ms (the units the final real-time clip shows). Under
// `slowmo`, an app-ms wait takes appMs/slowmo wall-ms. Keep the holds lean —
// Chrome throttles the CDP screencast compositor on long idle captures and
// starves the frame stream.
//
// Tuning is code-only (DEFAULT_TUNING in demo-config.ts). captureDemo installs
// it here via setTuning before any helper runs; the capture modules read the
// live binding (JOURNEY.<field>) rather than threading it through signatures.
export let JOURNEY: Tuning;

export const setTuning = (t: Tuning): void => {
  JOURNEY = t;
};

// The capture viewport IS the output video frame (CSS px). CAPTURE_SCALE
// supersamples the backing store: the page renders (and the screencast
// encodes) at 2× CSS px, and the composition scales back down — the map
// rasterizes at 2× its display size, so linework and labels come out crisp
// instead of soft. Cursor math stays in CSS px.
export const VIEWPORT = VIDEO;
export const CAPTURE_SCALE = 2;

// app-ms wait under the journey's slow-mo factor.
export const appWait = (page: Page, appMs: number) =>
  page.waitForTimeout(appMs / JOURNEY.slowmo);
