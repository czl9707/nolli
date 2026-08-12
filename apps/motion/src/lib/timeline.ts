export const FPS = 45;

// --- Durations in SECONDS. Frames derive via round(S * FPS). ---
export const WALK_SLOT_S = 4.5;     // per-building slot; total WALK = count × this
export const HOOK_S = 1.5;          // held world-map + title opener
export const WALK_CHROME_IN_S = 0.5; // WALK chrome fade-in across the slot-0 fly
export const CTA_LINE_S = 1.5;    // "Explore more in"
export const CTA_LOCKUP_S = 2.5;  // icon + Nolli hold
export const CTA_S = CTA_LINE_S + CTA_LOCKUP_S;

// The reel opens on HOOK: world map (left) + descriptive title (right). Slot 0's
// world→building fly then bridges HOOK→WALK (the title overlays its exit across
// that fly). Corner branding (architect title + @handle) overlays through WALK.
export const BRAND_FADE_OUT_LEAD_S = 0.4; // map/chrome fade-out lead into CTA

// --- Fractions of a WALK slot (0..1), independent of slot length. ---
export const FLY_FRAC = 0.6;
// Card-carousel slide: a punchy 0.5s ease-out snap into center at each slot
// start (decoupled from the camera fly), then the card holds.
export const SNAP_S = 0.5;
export const SNAP_FRAC = SNAP_S / WALK_SLOT_S;

/** Seconds → frames. The single source of truth for the S→frame conversion. */
export const secToFrames = (s: number): number => Math.round(s * FPS);

/** Frames in one WALK slot. The single source of truth for per-slot length —
 *  ctaStart and the WALK span both derive from count * SLOT_FRAMES so the
 *  captions <Series> (count slots of SLOT_FRAMES) exactly fills the WALK
 *  <Sequence> with no rounding mismatch. */
export const SLOT_FRAMES = secToFrames(WALK_SLOT_S);

/** Shared clamp options for interpolate() — used wherever a value shouldn't
 *  extrapolate past its domain. */
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// HOOK opens the reel (world map + descriptive title); WALK begins after HOOK_S.
export const WALK_START = secToFrames(HOOK_S);

/** CTA start depends on building count (WALK length scales with it). */
export function ctaStart(count: number): number {
  return WALK_START + count * SLOT_FRAMES;
}
export function totalFrames(count: number): number {
  return ctaStart(count) + secToFrames(CTA_S);
}

export const BEAT = { HOOK: 0, WALK: 1, CTA: 2 } as const;

export type TimelineState = { beat: number; currentIndex: number; intra: number };

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Resolve the beat + building index + intra-slot progress for a given frame. */
export function getTimelineState(frame: number, count: number): TimelineState {
  if (frame < WALK_START) {
    return { beat: BEAT.HOOK, currentIndex: 0, intra: 0 };
  }
  const cta = ctaStart(count);
  if (frame < cta) {
    const t = (frame - WALK_START) / (cta - WALK_START);
    const scaled = t * count;
    const idx = clamp(Math.floor(scaled), 0, count - 1);
    return { beat: BEAT.WALK, currentIndex: idx, intra: scaled - idx };
  }
  return { beat: BEAT.CTA, currentIndex: count - 1, intra: 0 };
}
