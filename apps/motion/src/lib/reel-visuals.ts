import { interpolate } from "remotion";
import {
  BEAT, CLAMP, FLY_FRAC,
  WALK_START, BRAND_FADE_IN_S, BRAND_FADE_OUT_LEAD_S,
  getTimelineState, ctaStart, secToFrames,
} from "./timeline";

/** Every per-frame visual value the composition renders, resolved in one place. */
export type ReelFrame = {
  beat: number;
  currentIndex: number;
  intra: number;
  /** Frame relative to CTA start (negative before CTA). */
  ctaFrame: number;
  /** Continuous fractional focused building — drives the card carousel. */
  carouselPos: number;
  /** Shared WALK chrome opacity (full-bleed map, gradient, carousel, corner
   *  brand): soft-fades in at the open, out into CTA. */
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

  // Chrome soft-fades in at the open, out into CTA.
  const fadeIn = interpolate(frame, [WALK_START, WALK_START + secToFrames(BRAND_FADE_IN_S)], [0, 1], CLAMP);
  const fadeOut = interpolate(frame, [cta - secToFrames(BRAND_FADE_OUT_LEAD_S), cta], [0, 1], CLAMP);
  const chromeOpacity = fadeIn * (1 - fadeOut);

  // Carousel roll COUPLED to the camera fly: the focused card climbs into
  // center over the slot's fly, arriving exactly as the camera settles on hold.
  const rollT = Math.min(1, st.intra / FLY_FRAC);
  const carouselPos = Math.max(0, st.currentIndex - (1 - rollT));

  // Camera is mid-flight only during a WALK slot's fly-in (intra < flyFrac).
  const cameraMoving = st.beat === BEAT.WALK && st.intra < FLY_FRAC;

  return {
    ...st,
    ctaFrame: frame - cta,
    carouselPos,
    chromeOpacity,
    cameraMoving,
  };
}
