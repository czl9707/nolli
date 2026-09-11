export const FPS = 45;

export const REEL_W = 1080;
export const REEL_H = 1080;

// --- Durations in SECONDS. Frames derive via round(S * FPS). ---
// Square ledger reel: opening (thumbnail — every card on the map, list
// pre-filled, resets) → intro (title in over the scaffold) → walk (one card +
// one ledger line per slot) → end (icon+text lockup). No hook, no CTA stage.
export const OPEN_S = 0.8;
export const INTRO_S = 1.2;
export const WALK_SLOT_S = 1.2;
export const END_S = 2.5;
/** Opening fade-out length; overlaps the intro's scaffold-in. */
export const OPEN_EXIT_S = 0.3;

export const secToFrames = (s: number): number => Math.round(s * FPS);

export const SLOT_FRAMES = secToFrames(WALK_SLOT_S);
export const OPEN_FRAMES = secToFrames(OPEN_S);
export const OPEN_EXIT_FRAMES = secToFrames(OPEN_EXIT_S);
export const INTRO_FRAMES = secToFrames(INTRO_S);
export const END_FRAMES = secToFrames(END_S);

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Last frame of the opening hold. */
export const openExitEnd = (): number => OPEN_FRAMES + OPEN_EXIT_FRAMES;
/** First walk landing (after opening exit + intro). */
export const walkStart = (): number => openExitEnd() + INTRO_FRAMES;

/** Absolute frame at which building `i` lands (card lights + line stamps). */
export const landFrame = (i: number): number => walkStart() + i * SLOT_FRAMES;

export function endStart(count: number): number {
  return walkStart() + count * SLOT_FRAMES;
}
export function totalFrames(count: number): number {
  return endStart(count) + END_FRAMES;
}
