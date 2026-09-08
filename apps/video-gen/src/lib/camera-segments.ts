import { secToFrames, SLOT_FRAMES, CTA_S, HOOK_FRAMES } from "./timeline";
import type { MapViewport } from "./viewport";
import type { ReelBuilding } from "./config";

export type HoldSegment = {
  kind: "hold";
  at: MapViewport;
  /** Slug highlighted while this segment is active (undefined = none). */
  selectedSlug?: string;
  durationInFrames: number;
};

export type FlightSegment = {
  kind: "flight";
  from: MapViewport;
  to: MapViewport;
  /** Slug highlighted while this segment is active (the destination building). */
  selectedSlug?: string;
  durationInFrames: number;
};

export type Segment = HoldSegment | FlightSegment;

/** Fraction of a WALK slot spent flying. Frame counts derive from the global
 *  constants so the camera chain and the content Sequences stay in lockstep. */
export const FLY_FRAC = 0.6;
const FLY_FRAMES = Math.round(FLY_FRAC * SLOT_FRAMES);
const HOLD_FRAMES = SLOT_FRAMES - FLY_FRAMES;
const CTA_FRAMES = secToFrames(CTA_S);

/** Build Hold(world) → Flight→Hold per building. Contiguity is by REFERENCE:
 *  each Flight's `from` is the preceding Hold's `at` object, and vice versa.
 *  The last Hold extends across the CTA beat. */
export function buildCameraSegments(
  buildings: ReelBuilding[],
  worldVP: MapViewport,
  cruiseZoom: number,
): Segment[] {
  const segs: Segment[] = [];

  segs.push({ kind: "hold", at: worldVP, durationInFrames: HOOK_FRAMES });

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const vp: MapViewport = { center: [b.coordinates.lng, b.coordinates.lat], zoom: cruiseZoom };
    const prev = segs[segs.length - 1];
    const from = prev.kind === "flight" ? prev.to : prev.at;
    segs.push({
      kind: "flight",
      from,
      to: vp,
      selectedSlug: b.slug,
      durationInFrames: FLY_FRAMES,
    });
    const isLast = i === buildings.length - 1;
    segs.push({
      kind: "hold",
      at: vp,
      selectedSlug: b.slug,
      durationInFrames: isLast ? HOLD_FRAMES + CTA_FRAMES : HOLD_FRAMES,
    });
  }

  return segs;
}
