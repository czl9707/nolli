/** Shared font tokens + optical nudges for the Remotion apps. The CSS vars
 *  resolve wherever packages/ui's global.css applies (body scope). */
export const SANS = "var(--font-sans)";
export const SERIF = "var(--font-serif)";
export const PLAYFUL = "var(--font-playful)";

/** Kalam's ink sits high in its em box (ink center ~0.137em above box
 *  center), so hand-set glyphs float above center-aligned neighbors. Every
 *  PLAYFUL role carries the measured optical nudge down — same trick as
 *  @nolli/ui's .note. */
export const KALAM_NUDGE = { position: "relative", top: "0.137em" } as const;

/** "Nolli" has no descenders, so its ink rides less high than Kalam's
 *  em-box average — ink-centroid vs the favicon mark measured 0.08em. */
export const NOLLI_WORDMARK_NUDGE = { position: "relative", top: "0.08em" } as const;
