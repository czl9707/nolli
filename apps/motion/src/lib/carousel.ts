import { SLOT_FRAMES, SNAP_FRAC } from "./timeline";

/** Continuous carousel scroll position for a WALK-local frame: maps the frame
 *  to a fractional focused-building, ease-out snapping into center at each slot
 *  start (decoupled from the camera fly), then holding. */
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
