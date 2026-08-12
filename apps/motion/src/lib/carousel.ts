import { SLOT_FRAMES, SNAP_FRAC } from "./timeline";

/**
 * Continuous carousel scroll position for a given WALK-local frame.
 *
 * The carousel is the one continuous consumer of WALK timing: it maps the
 * WALK-local frame to a fractional focused-building and applies a punchy
 * ease-out snap (decoupled from the camera fly) into center at each slot start,
 * then holds. Lifted from the dissolved `getReelVisuals`.
 *
 * Pure function of (walkFrame, count) — unit-tested in isolation.
 */
export function carouselPosFromWalkFrame(walkFrame: number, count: number): number {
  const walkFrames = count * SLOT_FRAMES;
  const t = Math.min(1, Math.max(0, walkFrame / walkFrames));
  const scaled = t * count;
  const idx = Math.max(0, Math.min(count - 1, Math.floor(scaled)));
  const intra = scaled - idx;
  const SNAP_EASE = 10;
  const rawT = Math.min(1, intra / SNAP_FRAC);
  const rollT = 1 - Math.pow(1 - rawT, SNAP_EASE);
  return Math.max(0, idx - (1 - rollT));
}
