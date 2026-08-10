export const FPS = 45;

// --- Durations in SECONDS. Frames derive via round(S * FPS). ---
export const WALK_SLOT_S = 4.5;     // per-building slot; total WALK = count × this
export const CTA_LINE_S = 1.5;    // "Explore more in"
export const CTA_LOCKUP_S = 2.5;  // icon + Nolli hold
export const CTA_S = CTA_LINE_S + CTA_LOCKUP_S;

// Motion-first open: the reel opens ON WALK — slot 0's world→building fly is
// the opener — so there's no HOOK/ESTABLISH beat. Corner branding (architect
// name + @handle) is overlaid through WALK and fades into CTA.
export const BRAND_FADE_IN_S = 0.3;       // corner brand soft-in at the open
export const BRAND_FADE_OUT_LEAD_S = 0.4; // brand fades out as CTA begins

// --- Fractions of a WALK slot (0..1), independent of slot length. ---
export const FLY_FRAC = 0.6;
// Card-carousel slide: a punchy 0.5s ease-out snap into center at each slot
// start (decoupled from the camera fly), then the card holds.
export const SNAP_S = 0.5;
export const SNAP_FRAC = SNAP_S / WALK_SLOT_S;

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
