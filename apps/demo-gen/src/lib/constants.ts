export const FPS = 30;
/** Frames per still image scene (0.6s @ 30fps + margin). */
export const STILL_FRAMES = 18;

// Text/logo segment tuning. Only primitives live here — fixed reveal windows
// and the post-reveal hold. The reveal takes the same time regardless of text
// length, so all segments share one window. Durations are frames @ FPS.
export const OUTRO = {
  typeFrames: 23, // fixed reveal-window budget (≈0.75s @30fps) — same for every segment
  hold: 6, // frames held fully revealed before exiting/cutting (0.2s)
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
