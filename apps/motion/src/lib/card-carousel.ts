// Vertical cyclic card-carousel geometry + math (1920×1080). Pure: no React/Remotion.

/** Focused card size: 4:5 portrait. */
export const CARD_W = 608;
export const CARD_H = 760;
/** First offset step (2nd card) — 15% of card height. */
export const CARD_PITCH = Math.round(CARD_H * 0.15);
/** Each successive offset step multiplies by this → diminishing pitch
 *  (perspective compression) for a receding 3D feel. */
export const PITCH_DECAY = 0.5;
/** Outermost visible card |distance|; anything beyond is hard-culled — the
 *  VEIL_CAP darkness hides the pop at the cull edge (no dissolve needed). */
export const CARD_DEPTH = 2;
/** bg-veil opacity on the outermost card. Caps <1 so receding cards read as
 *  darkened photos, never solid black boxes. */
export const VEIL_CAP = 0.8;
export const CARD_SCALE_STEP = 0.12;
export const CARD_Z_BASE = 100;
export const CARD_Z_STEP = 10;

export type CarouselCardState = {
  index: number;
  /** Signed cyclic distance from the focused position (negative = above center). */
  distance: number;
  scale: number;
  offsetY: number;
  zIndex: number;
  visible: boolean;
  veilOpacity: number;
};

/** Shortest signed cyclic distance from `i` to `position` around a ring of `count`. */
export function cyclicDistance(i: number, position: number, count: number): number {
  if (count <= 0) return 0;
  let d = (((i - position) % count) + count) % count; // [0, count)
  if (d > count / 2) d -= count; // (-count/2, count/2]
  return d;
}

/** Diminishing offset magnitude for absolute distance `ad` (geometric series). */
function offsetMagnitude(ad: number): number {
  return (CARD_PITCH * (1 - Math.pow(PITCH_DECAY, ad))) / (1 - PITCH_DECAY);
}

/** Resolve one card's stack state given the fractional focused `position`. */
export function carouselCard(i: number, position: number, count: number): CarouselCardState {
  const d = cyclicDistance(i, position, count);
  const ad = Math.abs(d);
  return {
    index: i,
    distance: d,
    scale: 1 - CARD_SCALE_STEP * ad,
    offsetY: Math.round(Math.sign(d) * offsetMagnitude(ad)),
    zIndex: CARD_Z_BASE - Math.round(ad * CARD_Z_STEP),
    visible: ad <= CARD_DEPTH,
    veilOpacity: Math.min(VEIL_CAP, (ad / CARD_DEPTH) * VEIL_CAP),
  };
}
