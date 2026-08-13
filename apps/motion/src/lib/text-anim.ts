import { interpolate } from "remotion";
import { CLAMP } from "./timeline";

/** A timed phase of the soft-blur animation (entrance or exit).
 *  - `when`: frame the phase begins (char 0's reveal begin / exit begin).
 *  - `last`: frame the phase completes (last char settled / exit complete).
 *  - `enabled`: false = skip the phase entirely (render settled / hold). */
export type Phase = {
  when: number;
  last: number;
  enabled: boolean;
};

export type CharStyle = { opacity: number; blur: number; translateY: number };

// Fixed physics — internal, not call-tunable.
const CHAR_REVEAL_F = 8;
const ENTRANCE_BLUR_PX = 14;
const ENTRANCE_RISE_PX = 14;

/** Per-character "soft blur in" entrance + blur-out-up exit. Entrance is
 *  per-char staggered: char `i` begins at `start.when + i*staggerF` and resolves
 *  `CHAR_REVEAL_F` later, where `staggerF` is DERIVED from the entrance window
 *  so the last char settles exactly at `start.last`. Exit is synchronous; a
 *  disabled phase is a no-op. */
export function softBlurChar(
  frame: number,
  charIndex: number,
  charCount: number,
  start: Phase,
  end: Phase,
): CharStyle {
  const staggerF = charCount > 1
    ? Math.max(0, (start.last - start.when - CHAR_REVEAL_F) / (charCount - 1))
    : 0;
  const pIn = start.enabled
    ? interpolate(
        frame,
        [start.when + charIndex * staggerF, start.when + charIndex * staggerF + CHAR_REVEAL_F],
        [0, 1],
        CLAMP,
      )
    : 1;
  const pOut = end.enabled
    ? interpolate(frame, [end.when, end.last], [0, 1], CLAMP)
    : 0;

  return {
    opacity: pIn * (1 - pOut),
    blur: ENTRANCE_BLUR_PX * (1 - pIn + pOut),
    translateY: ENTRANCE_RISE_PX * (1 - pIn - pOut),
  };
}
