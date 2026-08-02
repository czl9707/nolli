// Outro brand-segment tuning. Only primitives live here — per-char speed and
// the post-typing hold. Segment durations are DERIVED from the actual text
// length (see segmentDuration), so swapping content never needs hand-edits.
// Mirrors the BROLL pattern in assets-morph.ts. Durations are frames @ FPS.
export const OUTRO = {
  charFrames: 3, // frames per revealed character (≈10 chars/s @30fps)
  hold: 15, // frames held after typing finishes before cutting on (0.5s)
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

// Frames a typing segment runs: entrance beat + (chars-1)*charFrames + hold.
export function segmentDuration(textLen: number, typeStart: number): number {
  const typed = textLen <= 0 ? 0 : (textLen - 1) * OUTRO.charFrames;
  return typeStart + typed + OUTRO.hold;
}

// Per-segment duration for a given manifest. name/count depend on content;
// now/logo are fixed-length.
export const outroSegmentDurations = (manifest: { architect: string; count: number }) => ({
  name: segmentDuration(manifest.architect.length, OUTRO.typeStart.name),
  count: segmentDuration(countText(manifest.count).length, OUTRO.typeStart.count),
  now: segmentDuration(NOW_TEXT.length, OUTRO.typeStart.now),
  logo: segmentDuration(LOGO_WORD.length, OUTRO.logo.typeStart),
});

export const outroDuration = (manifest: { architect: string; count: number }) => {
  const d = outroSegmentDurations(manifest);
  return d.name + d.count + d.now + d.logo;
};

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
