export const FPS = 45;

// --- Durations in SECONDS. Frames derive via round(S * FPS). ---
export const WALK_SLOT_S = 2.5;   // per-building slot; total WALK = count × this
export const CTA_LINE_S = 1.5;    // "Explore more in"
export const CTA_LOCKUP_S = 2.5;  // icon + Nolli hold
export const CTA_S = CTA_LINE_S + CTA_LOCKUP_S;
export const TIMELINE_WINDOW = 5;

// Motion-first open: the reel opens ON WALK — slot 0's world→building fly is
// the opener — so there's no HOOK/ESTABLISH beat. Corner branding (architect
// name + @handle) is overlaid through WALK and fades into CTA.
export const BRAND_FADE_IN_S = 0.3;       // corner brand soft-in at the open
export const BRAND_FADE_OUT_LEAD_S = 0.4; // brand fades out as CTA begins

// --- Fractions of a WALK slot (0..1), independent of slot length. ---
// FLY_FRAC splits each slot: flying for FLY_FRAC, holding for the rest.
export const FLY_FRAC = 0.625;
export const ROLL_FRAC = 1 / WALK_SLOT_S;   // carousel advances in ~1s of the slot
export const SLOT_FADE_FRAC = 0.12;         // per-building cover/text fade slice at slot edges
export const CONTENT_RAMP = [0, SLOT_FADE_FRAC, 1 - SLOT_FADE_FRAC, 1] as const;

/** Seconds → frames. The single source of truth for the S→frame conversion. */
export const secToFrames = (s: number): number => Math.round(s * FPS);

/** Shared clamp options for interpolate() — used wherever a value shouldn't
 *  extrapolate past its domain. */
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// WALK begins at frame 0 (motion-first open).
export const WALK_START = 0;

/** CTA start depends on building count (WALK length scales with it). */
export function ctaStart(count: number): number {
  return WALK_START + secToFrames(count * WALK_SLOT_S);
}
export function totalFrames(count: number): number {
  return ctaStart(count) + secToFrames(CTA_S);
}

export const BEAT = { WALK: 0, CTA: 1 } as const;

export type TimelineState = { beat: number; currentIndex: number; intra: number };

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Resolve the beat + building index + intra-slot progress for a given frame. */
export function getTimelineState(frame: number, count: number): TimelineState {
  const cta = ctaStart(count);
  if (frame < cta) {
    const t = (frame - WALK_START) / (cta - WALK_START);
    const scaled = t * count;
    const idx = clamp(Math.floor(scaled), 0, count - 1);
    return { beat: BEAT.WALK, currentIndex: idx, intra: scaled - idx };
  }
  return { beat: BEAT.CTA, currentIndex: count - 1, intra: 0 };
}
