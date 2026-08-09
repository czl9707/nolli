export const FPS = 45;

// --- All durations in SECONDS. Frames derive via round(S * FPS). ---
export const HOOK_S = 2.5;
export const ESTABLISH_S = 3.0;
export const WALK_SLOT_S = 5.0;   // per building
export const WALK_HOLD_S = 2.0;   // hold on building[i] at cruise zoom
export const WALK_FLY_S = 3.0;    // fly building[i] -> building[i+1]
// invariant: WALK_HOLD_S + WALK_FLY_S === WALK_SLOT_S
export const CTA_LINE_S = 2.0;    // "Explore more in"
export const CTA_LOCKUP_S = 3.0;  // icon + Nolli hold
export const CTA_S = CTA_LINE_S + CTA_LOCKUP_S;
export const TIMELINE_WINDOW = 5;

// ESTABLISH→WALK hand-off (rhythm, not layout): the timeline slides to the
// corner over the final TL_SLIDE_LEAD_S of ESTABLISH, then the map fades in
// over the final GRID_FADE_LEAD_S — serialized so they never overlap mid-slide.
export const TL_SLIDE_LEAD_S = 1.4;
export const GRID_FADE_LEAD_S = 0.4;

/** Seconds → frames. The single source of truth for the S→frame conversion. */
export const secToFrames = (s: number): number => Math.round(s * FPS);

/** Shared clamp options for interpolate() — used wherever a value shouldn't
 *  extrapolate past its domain. */
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const HOOK_START = 0;
export const ESTABLISH_START = secToFrames(HOOK_S);
export const WALK_START = secToFrames(HOOK_S + ESTABLISH_S);

/** CTA start depends on building count (WALK length scales with it). */
export function ctaStart(count: number): number {
  return WALK_START + secToFrames(count * WALK_SLOT_S);
}
export function totalFrames(count: number): number {
  return ctaStart(count) + secToFrames(CTA_S);
}

export const BEAT = { HOOK: 0, ESTABLISH: 1, WALK: 2, CTA: 3 } as const;

export type TimelineState = { beat: number; currentIndex: number; intra: number };

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Resolve the beat + building index + intra-slot progress for a given frame. */
export function getTimelineState(frame: number, count: number): TimelineState {
  if (frame < ESTABLISH_START) return { beat: BEAT.HOOK, currentIndex: 0, intra: 0 };
  if (frame < WALK_START) return { beat: BEAT.ESTABLISH, currentIndex: 0, intra: 0 };
  const cta = ctaStart(count);
  if (frame < cta) {
    const t = (frame - WALK_START) / (cta - WALK_START);
    const scaled = t * count;
    const idx = clamp(Math.floor(scaled), 0, count - 1);
    return { beat: BEAT.WALK, currentIndex: idx, intra: scaled - idx };
  }
  return { beat: BEAT.CTA, currentIndex: count - 1, intra: 0 };
}

// Back-compat aliases (composition imports these).
export const BEAT_WALK_START = WALK_START;
export const BEAT_WALK_END = ctaStart;
