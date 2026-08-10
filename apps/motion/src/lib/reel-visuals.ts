import { interpolate } from "remotion";
import {
  BEAT, CLAMP, CONTENT_RAMP, ROLL_FRAC, FLY_FRAC,
  WALK_START, BRAND_FADE_IN_S, BRAND_FADE_OUT_LEAD_S,
  getTimelineState, ctaStart, secToFrames,
} from "./timeline";

/** Layout constants the per-frame visuals project against (1920×1080 composition). */
export type ReelGeometry = {
  PAD: number;
  TL_W: number;
  TIMELINE_H: number;
  PANEL_W: number;
  PANEL_H: number;
};

/** Every per-frame visual value the composition renders, resolved in one place. */
export type ReelFrame = {
  beat: number;
  currentIndex: number;
  intra: number;
  /** Frame relative to CTA start (negative before CTA). */
  ctaFrame: number;
  // Single timeline layer: fixed in the bottom-left corner throughout WALK.
  tlLeft: number;
  tlTop: number;
  tlScale: number;
  /** Shared chrome opacity (timeline strip + corner brand): soft-in at the open,
   *  out into CTA. */
  tlOpacity: number;
  gridOpacity: number;
  showGrid: boolean;
  inWalkEra: boolean;
  // Per-building rhythm within a WALK slot.
  carouselPos: number;
  contentOpacity: number;
  contentX: number;
  /** True while the camera is mid-flight; false once it has settled on a hold.
   *  Drives the capture tile-wait gate (see useMapCamera). */
  cameraMoving: boolean;
};

/**
 * Resolve the full per-frame visual state for the reel. Pure function of
 * (frame, count, geometry) — no React, no buildings — so the composition body
 * is left to do nothing but lay these values out. Wraps `getTimelineState` (the
 * beat/index/intra state machine) and derives every position/opacity/scale the
 * JSX reads.
 */
export function getReelVisuals(frame: number, count: number, geo: ReelGeometry): ReelFrame {
  const st = getTimelineState(frame, count);
  const cta = ctaStart(count);

  // Timeline fixed in the bottom-left corner for the whole WALK era (motion-first
  // open: there's no centered establish beat to slide from).
  const tlLeft = geo.PAD;
  const tlTop = geo.PANEL_H - geo.PAD - geo.TIMELINE_H;
  const tlScale = 1;

  // Chrome (timeline + corner brand) soft-fades in at the open, out into CTA.
  const brandIn = interpolate(frame, [WALK_START, WALK_START + secToFrames(BRAND_FADE_IN_S)], [0, 1], CLAMP);
  const brandOut = interpolate(frame, [cta - secToFrames(BRAND_FADE_OUT_LEAD_S), cta], [0, 1], CLAMP);
  const tlOpacity = (1 - brandOut) * brandIn;

  const inWalkEra = st.beat === BEAT.WALK;
  const showGrid = inWalkEra;
  const gridOpacity = inWalkEra ? 1 : 0;

  // Carousel roll: brisk 1s advance into the next item, decoupled from the map
  // fly so the list moves while the map glides.
  const rollT = Math.min(1, st.intra / ROLL_FRAC);
  const carouselPos = Math.max(0, st.currentIndex - (1 - rollT));

  // Per-building cover/text: fades in from the right, holds, fades out to the
  // left — mirroring the carousel's roll direction.
  const contentOpacity = interpolate(st.intra, CONTENT_RAMP, [0, 1, 1, 0], CLAMP);
  const contentX = interpolate(st.intra, CONTENT_RAMP, [56, 0, 0, -56], CLAMP);

  // Camera is mid-flight only during a WALK slot's fly-in (intra < flyFrac).
  // Everywhere else (WALK hold, CTA) it has settled.
  const cameraMoving = st.beat === BEAT.WALK && st.intra < FLY_FRAC;

  return {
    ...st,
    ctaFrame: frame - cta,
    tlLeft, tlTop, tlScale, tlOpacity,
    gridOpacity, showGrid, inWalkEra,
    carouselPos, contentOpacity, contentX,
    cameraMoving,
  };
}
