import { secToFrames, SLOT_FRAMES, FLY_FRAC, CTA_S, WALK_START } from "./timeline";
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

/** Frame counts derived from the global constants — same source of truth as the
 *  beat durations, so the camera chain and the content Sequences stay in lockstep
 *  (no independent rounding; the WALK-duration lesson). */
const HOOK_FRAMES = WALK_START;               // HOOK holds the world view (== WALK_START)
const FLY_FRAMES = Math.round(FLY_FRAC * SLOT_FRAMES);
const HOLD_FRAMES = SLOT_FRAMES - FLY_FRAMES;
const CTA_FRAMES = secToFrames(CTA_S);

/**
 * Build the flat camera-segment chain:
 *   Hold(world) → Flight(world→b0) → Hold(b0) → Flight(b0→b1) → … → Hold(bN)
 * Contiguity is by REFERENCE: each Flight's `from` is the same object as the
 * preceding Hold's `at`, and each Hold's `at` is the same object as the
 * preceding Flight's `to`. Total duration === ctaStart(count) + CTA_FRAMES
 * (HOOK + WALK + CTA); the last Hold(bN) extends across the CTA beat so the
 * camera holds on the final building through CTA.
 *
 * `selectedSlug`: world segments → undefined (no highlight); per-building
 * segments → that building's slug (the highlight moves to the destination at
 * flight start).
 */
export function buildCameraSegments(
  buildings: ReelBuilding[],
  worldVP: MapViewport,
  cruiseZoom: number,
): Segment[] {
  const segs: Segment[] = [];

  // Leading Hold(world): full HOOK duration. No highlight on the world stage.
  segs.push({ kind: "hold", at: worldVP, durationInFrames: HOOK_FRAMES });

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const vp: MapViewport = { center: [b.coordinates.lng, b.coordinates.lat], zoom: cruiseZoom };
    // Flight from the previous segment's "to"/"at" (reference equality) into b[i].
    const prev = segs[segs.length - 1];
    const from = prev.kind === "flight" ? prev.to : prev.at;
    segs.push({
      kind: "flight",
      from,             // === prev's viewport (reference)
      to: vp,           // === the Hold we push next's `at` (reference)
      selectedSlug: b.slug,
      durationInFrames: FLY_FRAMES,
    });
    // The final building's Hold extends through CTA.
    const isLast = i === buildings.length - 1;
    segs.push({
      kind: "hold",
      at: vp,           // === the Flight's `to` (reference)
      selectedSlug: b.slug,
      durationInFrames: isLast ? HOLD_FRAMES + CTA_FRAMES : HOLD_FRAMES,
    });
  }

  return segs;
}
