export const FPS = 45;

export const REEL_W = 1080;
export const REEL_H = 1080;

// --- Durations in SECONDS. Frames derive via round(S * FPS). ---
// Square ledger reel: intro (title in over the scaffold) → walk (one card +
// one ledger line per slot) → end (icon+text lockup). No hook, no CTA stage.
export const INTRO_S = 1.2;
export const WALK_SLOT_S = 1.2;
export const END_S = 2.5;

export const secToFrames = (s: number): number => Math.round(s * FPS);

export const SLOT_FRAMES = secToFrames(WALK_SLOT_S);
export const INTRO_FRAMES = secToFrames(INTRO_S);
export const END_FRAMES = secToFrames(END_S);

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Absolute frame at which building `i` lands (card lights + line stamps). */
export const landFrame = (i: number): number => INTRO_FRAMES + i * SLOT_FRAMES;

export function endStart(count: number): number {
  return INTRO_FRAMES + count * SLOT_FRAMES;
}
export function totalFrames(count: number): number {
  return endStart(count) + END_FRAMES;
}
