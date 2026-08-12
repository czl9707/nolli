import { interpolate } from "remotion";
import {
  BEAT, CLAMP, FLY_FRAC, SNAP_FRAC,
  WALK_START, WALK_CHROME_IN_S, BRAND_FADE_OUT_LEAD_S,
  getTimelineState, ctaStart, secToFrames,
} from "./timeline";

/** Every per-frame visual value the composition renders, resolved in one place. */
export type ReelFrame = {
  beat: number;
  currentIndex: number;
  intra: number;
  /** Continuous fractional focused building — drives the card carousel. */
  carouselPos: number;
  /** Map (+gradient) opacity: full from frame 0 through WALK, fades out into
   *  CTA. Separate from chromeOpacity so the map stays visible during HOOK and
   *  doesn't dip at WALK_START. */
  mapOpacity: number;
  /** WALK chrome opacity (carousel, caption, corner brand): 0 during HOOK,
   *  fades in across the slot-0 fly, out into CTA. */
  chromeOpacity: number;
  /** True while the camera is mid-flight; false once settled on a hold. */
  cameraMoving: boolean;
};

/**
 * Resolve the full per-frame visual state for the reel. Pure function of
 * (frame, count) — no React, no buildings — so the composition body does
 * nothing but lay these values out. Wraps `getTimelineState`.
 */
export function getReelVisuals(frame: number, count: number): ReelFrame {
  const st = getTimelineState(frame, count);
  const cta = ctaStart(count);

  // Shared CTA fade-out (into CTA).
  const fadeOut = interpolate(frame, [cta - secToFrames(BRAND_FADE_OUT_LEAD_S), cta], [0, 1], CLAMP);

  // Map is the static stage: full from frame 0 through WALK, only fades out
  // into CTA (no fade-in, no dip at WALK_START).
  const mapOpacity = 1 - fadeOut;

  // WALK chrome (carousel, caption, brand) is off during HOOK and fades in
  // across the slot-0 fly.
  const chromeFadeIn = interpolate(frame, [WALK_START, WALK_START + secToFrames(WALK_CHROME_IN_S)], [0, 1], CLAMP);
  const chromeOpacity = chromeFadeIn * (1 - fadeOut);

  // Carousel slide: a punchy 0.5s ease-out snap into center at each slot start
  // (decoupled from the camera fly), then holds. Higher SNAP_EASE = harder
  // accel out of the gate + crisper settle (speed change reads more obviously).
  const SNAP_EASE = 10;
  const rawT = Math.min(1, st.intra / SNAP_FRAC);
  const rollT = 1 - Math.pow(1 - rawT, SNAP_EASE);
  const carouselPos = Math.max(0, st.currentIndex - (1 - rollT));

  // Camera is mid-flight only during a WALK slot's fly-in (intra < flyFrac).
  const cameraMoving = st.beat === BEAT.WALK && st.intra < FLY_FRAC;

  return {
    ...st,
    carouselPos,
    mapOpacity,
    chromeOpacity,
    cameraMoving,
  };
}
