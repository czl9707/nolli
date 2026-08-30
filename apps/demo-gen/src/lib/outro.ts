// Outro brand-segment tuning. Only primitives live here — a fixed typing
// duration and the post-typing hold. The reveal takes the same time regardless
// of text length, so all four segments share one typing window. Durations are
// frames @ FPS.
export const OUTRO = {
  typeFrames: 23, // fixed reveal-window budget (≈0.75s @30fps) — same for every segment
  hold: 6, // frames held fully revealed before exiting/cutting (0.2s)
  // Per-word reveal (WordReveal). Each word lands over `reveal` frames; words
  // stagger `stagger` apart so a line builds rhythmically. `rise`/`blur` are the
  // slide-up (px) and gaussian blur (px) that clear as a word lands.
  word: {
    reveal: 10,
    stagger: 4,
    rise: 10,
    blur: 6,
  },
  exitFrames: 8, // frames a text card spends wiping out before the cut (logo holds)
  logo: {
    markIn: 6, // frame the mark starts scaling/fading in
    markSettle: 18, // frame the mark reaches final size
    typeStart: 20, // frame "Nolli" begins revealing to the right
    size: 96, // mark render height in px
  },
} as const;

// Fixed segment text — kept here so duration math and rendering agree.
export const NOW_TEXT = "Now available in";
export const LOGO_WORD = "Nolli";
export const countText = (count: number) =>
  `${count} ${count === 1 ? "Architecture" : "Architectures"}`;

// Frames a segment runs: entrance beat + (reveal window) + hold + exit.
// Independent of text length — empty text skips the reveal window. The logo is
// the final lockup and passes exit=false so it holds instead of wiping out.
export function segmentDuration(textLen: number, typeStart: number, exit = false): number {
  const typed = textLen <= 0 ? 0 : OUTRO.typeFrames;
  return typeStart + typed + OUTRO.hold + (exit ? OUTRO.exitFrames : 0);
}

// Frame at which a segment's exit wipe begins (entrance + reveal + hold).
export function exitStartFrame(typeStart: number): number {
  return typeStart + OUTRO.typeFrames + OUTRO.hold;
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
