export const FPS = 30;
export const TOTAL_FRAMES = 900;

export const BEAT = {
  HOOK: 0,
  ESTABLISH: 1,
  WALK: 2,
  WHOLE: 3,
  NAME: 4,
  CTA: 5,

  HOOK_START: 0,
  ESTABLISH_START: 60,
  WALK_START: 120,
  WHOLE_START: 570,
  NAME_START: 690,
  CTA_START: 810,

  WALK_END: 570,
} as const;

export const BEAT_WALK_START = BEAT.WALK_START;
export const BEAT_WALK_END = BEAT.WALK_END;
export const BEAT_WHOLE_START = BEAT.WHOLE_START;

export type TimelineState = {
  beat: number;
  currentIndex: number;
  intra: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function getTimelineState(frame: number, count: number, hookIndex: number): TimelineState {
  if (frame < BEAT.ESTABLISH_START) {
    return { beat: BEAT.HOOK, currentIndex: hookIndex, intra: 0 };
  }
  if (frame < BEAT.WALK_START) {
    return { beat: BEAT.ESTABLISH, currentIndex: hookIndex, intra: 0 };
  }
  if (frame < BEAT.WHOLE_START) {
    const walkLen = BEAT.WHOLE_START - BEAT.WALK_START;
    const t = (frame - BEAT.WALK_START) / walkLen;
    const scaled = t * count;
    const idx = clamp(Math.floor(scaled), 0, count - 1);
    return { beat: BEAT.WALK, currentIndex: idx, intra: scaled - idx };
  }
  if (frame < BEAT.NAME_START) {
    return { beat: BEAT.WHOLE, currentIndex: count - 1, intra: 0 };
  }
  if (frame < BEAT.CTA_START) {
    return { beat: BEAT.NAME, currentIndex: count - 1, intra: 0 };
  }
  return { beat: BEAT.CTA, currentIndex: count - 1, intra: 0 };
}
