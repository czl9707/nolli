import type { Page } from "playwright";
import type { Tuning } from "../seed/demo-config";

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

export const VIEWPORT = { width: 1920, height: 1080 };

// app-ms wait under the journey's slow-mo factor.
export const appWait = (page: Page, appMs: number) =>
  page.waitForTimeout(appMs / JOURNEY.slowmo);
