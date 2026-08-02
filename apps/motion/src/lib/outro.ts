// Outro brand-segment tuning. Constants that live with the app — hand-tune as
// the flow develops (mirrors the BROLL pattern in assets-morph.ts). Every
// duration is in frames @ FPS (see lib/timing.ts).
export const OUTRO = {
  charFrames: 3, // frames per revealed character (≈10 chars/s @30fps)
  hold: 15, // frames held after typing finishes before cutting to next segment (0.5s)
  segments: {
    // Each = (typeStart + (chars-1)*charFrames) + hold.
    name: 35, // "SANAA"(5): 8 + 4*3 + 15
    count: 65, // "9 architectures"(15): 8 + 14*3 + 15
    now: 65, // "Now available in"(15): 8 + 14*3 + 15
    logo: 47, // mark markIn→markSettle, "Nolli"(5): 20 + 4*3 + 15
  },
  // Per-segment frame at which typing begins (after a short entrance beat).
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

export const outroDuration =
  OUTRO.segments.name + OUTRO.segments.count + OUTRO.segments.now + OUTRO.segments.logo;

// Number of characters visible at `frame` for an expand-from-center typewriter.
// The segment renders `text.slice(0, n)` centered, so the partial re-centers
// every frame and grows symmetrically from the middle.
export function visibleCharCount(opts: {
  frame: number;
  start: number;
  charFrames: number;
  length: number;
}): number {
  if (opts.frame < opts.start) return 0;
  return Math.max(0, Math.min(opts.length, Math.floor((opts.frame - opts.start) / opts.charFrames) + 1));
}
