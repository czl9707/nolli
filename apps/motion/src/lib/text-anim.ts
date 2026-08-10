import { interpolate } from "remotion";
import { CLAMP } from "./timeline";

/** Per-character "soft blur in" entrance + blur-out-up exit. Pure function of
 *  (frame, charIndex) so it stays unit-testable and drivable from the timeline;
 *  the `SoftBlurIn` component is a thin render wrapper over this. */
export type SoftBlurOpts = {
  start: number; // frame the first char begins revealing
  revealF: number; // frames each char spends entering
  staggerF: number; // frames between successive chars
  blurPx: number; // entrance blur radius, decays to 0
  risePx: number; // entrance upward offset, decays to 0
  exitStart: number; // frame the exit begins (Infinity = hold, no exit)
  exitF: number; // frames the exit lasts
};

/** Punchy defaults @ FPS=45, scaled from remocn's "60f @ 30fps" natural length.
 *  Tunable per-call via SoftBlurIn props. */
export const SOFT_BLUR_DEFAULTS: SoftBlurOpts = {
  start: 0,
  revealF: 8,
  staggerF: 2,
  blurPx: 14,
  risePx: 14,
  exitStart: Infinity,
  exitF: 8,
};

export type CharStyle = { opacity: number; blur: number; translateY: number };

/** Resolve one character's opacity / blur / vertical offset at `frame`.
 *  Entrance: opacity 0→1, blurPx→0, risePx→0, staggered per char.
 *  Exit (finite exitStart): blur-out-up — opacity→0, blur→blurPx, rises −risePx. */
export function softBlurChar(frame: number, charIndex: number, opts: SoftBlurOpts): CharStyle {
  const charStart = opts.start + charIndex * opts.staggerF;
  const pIn = interpolate(frame, [charStart, charStart + opts.revealF], [0, 1], CLAMP);
  const pOut = Number.isFinite(opts.exitStart)
    ? interpolate(frame, [opts.exitStart, opts.exitStart + opts.exitF], [0, 1], CLAMP)
    : 0;

  return {
    opacity: pIn * (1 - pOut),
    blur: opts.blurPx * (1 - pIn) + opts.blurPx * pOut,
    translateY: opts.risePx * (1 - pIn) - opts.risePx * pOut,
  };
}
