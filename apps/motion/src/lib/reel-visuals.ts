import { interpolate } from "remotion";
import {
  BEAT, CLAMP, CONTENT_RAMP, ROLL_FRAC, FLY_FRAC,
  ESTABLISH_START, WALK_START, SLIDE_START, GRID_START,
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
  // Single timeline layer: centered during ESTABLISH, eased to the bottom-left corner for WALK.
  tlLeft: number;
  tlTop: number;
  tlScale: number;
  tlOpacity: number;
  // WALK grid (cover/text + map): fades in over the tail of ESTABLISH.
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

const ESTABLISH_IN_S = 0.3; // timeline fades in at the start of ESTABLISH
const CTA_CROSSFADE_S = 0.4; // timeline crossfades out as CTA begins

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

  // ESTABLISH→WALK hand-off: the timeline layer eases center→corner over
  // [SLIDE_START, GRID_START], then the grid fades in over [GRID_START, WALK_START].
  // Serialized windows so the layer is tucked away before the map appears.
  const tlEaseT = interpolate(frame, [SLIDE_START, GRID_START], [0, 1], CLAMP);
  const gridOpacity = interpolate(frame, [GRID_START, WALK_START], [0, 1], CLAMP);
  const tlLeft = interpolate(tlEaseT, [0, 1], [(geo.PANEL_W - geo.TL_W) / 2, geo.PAD], CLAMP);
  const tlTop = interpolate(tlEaseT, [0, 1], [(geo.PANEL_H - geo.TIMELINE_H) / 2, geo.PANEL_H - geo.PAD - geo.TIMELINE_H], CLAMP);
  const tlScale = interpolate(tlEaseT, [0, 1], [1.12, 1], CLAMP);

  const establishIn = interpolate(frame, [ESTABLISH_START, ESTABLISH_START + secToFrames(ESTABLISH_IN_S)], [0, 1], CLAMP);
  const ctaIn = interpolate(frame, [cta - secToFrames(CTA_CROSSFADE_S), cta], [0, 1], CLAMP);
  const tlOpacity = (1 - ctaIn) * establishIn;

  const inWalkEra = st.beat === BEAT.ESTABLISH || st.beat === BEAT.WALK;
  const showGrid = inWalkEra && frame >= GRID_START;

  // Carousel roll: brisk 1s advance into the next item, decoupled from the 3s
  // map fly so the list moves while the map glides.
  const rollT = Math.min(1, st.intra / ROLL_FRAC);
  const carouselPos = Math.max(0, st.currentIndex - (1 - rollT));

  // Per-building cover/text: fades in from the right, holds, fades out to the
  // left — mirroring the carousel's roll direction.
  const contentOpacity = interpolate(st.intra, CONTENT_RAMP, [0, 1, 1, 0], CLAMP);
  const contentX = interpolate(st.intra, CONTENT_RAMP, [56, 0, 0, -56], CLAMP);

  // Camera is mid-flight only during a WALK slot's fly-in (intra < flyFrac).
  // Everywhere else (ESTABLISH world hold, WALK hold, CTA) it has settled.
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
