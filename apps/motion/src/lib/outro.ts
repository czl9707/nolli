// Outro brand-segment tuning. Only primitives live here — a fixed typing
// duration and the post-typing hold. The reveal takes the same time regardless
// of text length, so all four segments share one typing window. Durations are
// frames @ FPS.
export const OUTRO = {
  typeFrames: 23, // fixed typing-window length (≈0.75s @30fps) — same for every segment
  hold: 15, // frames held after typing finishes before cutting (0.5s)
  typeStart: {
    name: 8,
    count: 8,
    now: 8,
  },
  logo: {
    markIn: 6, // frame the mark starts scaling/fading in
    markSettle: 18, // frame the mark reaches final size
    typeStart: 20, // frame "Nolli" begins typing to the right
    size: 96, // mark render height in px
  },
} as const;

// Fixed segment text — kept here so duration math and rendering agree.
export const NOW_TEXT = "Now available in";
export const LOGO_WORD = "Nolli";
export const countText = (count: number) =>
  `${count} ${count === 1 ? "architecture" : "architectures"}`;

// Frames a typing segment runs: entrance beat + (fixed typing window) + hold.
// Independent of text length — empty text skips the typing window.
export function segmentDuration(textLen: number, typeStart: number): number {
  const typed = textLen <= 0 ? 0 : OUTRO.typeFrames;
  return typeStart + typed + OUTRO.hold;
}

// Number of characters visible at `frame` for an expand-from-center typewriter
// that reveals all chars linearly over `typeFrames`. One char at `start`, all at
// `start + typeFrames`; the segment renders `text.slice(0, n)` centered, so the
// partial re-centers every frame and grows symmetrically from the middle.
export function visibleCharCount(opts: {
  frame: number;
  start: number;
  typeFrames: number;
  length: number;
}): number {
  if (opts.length <= 0) return 0;
  if (opts.frame < opts.start) return 0;
  if (opts.typeFrames <= 0) return opts.length;
  const progress = (opts.frame - opts.start) / opts.typeFrames;
  return Math.max(1, Math.min(opts.length, Math.ceil(progress * opts.length)));
}
