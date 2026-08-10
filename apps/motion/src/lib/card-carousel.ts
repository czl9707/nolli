// Vertical cyclic card-carousel geometry + math (1920×1080 composition).
// Pure: no React, no Remotion. The CardCarousel component consumes these.

/** Focused card size: 4:5 portrait. Height ≈70% of the 1080 canvas → cards
 *  dominate the frame; width fits the right-side bg zone with breathing room
 *  left of the map edge. */
export const CARD_W = 608;
export const CARD_H = 760;
/** First offset step (2nd card) — 15% of card height. */
export const CARD_PITCH = Math.round(CARD_H * 0.15);
/** Each successive offset step is multiplied by this → diminishing pitch
 *  (perspective compression). 0.5 = 2nd card one step, 3rd card half a step
 *  more, etc. Gives the stack a receding 3D feel. */
export const PITCH_DECAY = 0.5;
/** Outermost visible card |distance|; anything beyond is culled (no dissolve —
 *  the VEIL_CAP darkness hides the pop at the cull edge). */
export const CARD_DEPTH = 2;
/** bg-veil opacity reached on the outermost card (depth darkening). Caps <1 so
 *  receding cards read as darkened photos in depth, never solid black boxes. */
export const VEIL_CAP = 0.8;
/** Scale shrinks by this per unit distance from center. */
export const CARD_SCALE_STEP = 0.12;
/** z-index base for the centered card; receding cards step down from here. */
export const CARD_Z_BASE = 100;
export const CARD_Z_STEP = 10;

export type CarouselCardState = {
  index: number;
  /** Signed cyclic distance from the focused position (negative = above center). */
  distance: number;
  scale: number;
  /** Vertical px offset from center (negative = up). Diminishing pitch: each
   *  step is PITCH_DECAY× the last, so the stack compresses with depth. */
  offsetY: number;
  zIndex: number;
  visible: boolean;
  /** bg-veil opacity over the image — 0 at center, ramping to VEIL_CAP at the
   *  outermost card. Depth darkening, never a solid black box. */
  veilOpacity: number;
};

/** Shortest signed cyclic distance from `i` to `position` around a ring of `count`. */
export function cyclicDistance(i: number, position: number, count: number): number {
  if (count <= 0) return 0;
  let d = (((i - position) % count) + count) % count; // [0, count)
  if (d > count / 2) d -= count; // (-count/2, count/2]
  return d;
}

/** Diminishing offset magnitude for absolute distance `ad`: the first step is
 *  CARD_PITCH, each subsequent step PITCH_DECAY× the last (geometric series). */
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

/** |distance| over which the caption overlay ramps from 1 (center) → 0. */
export const OVERLAY_HALF_STEP = 0.5;

/** Caption-overlay opacity for a card at `distance` from center: 1 at the
 *  focused card, ramping to 0 by |distance| = OVERLAY_HALF_STEP. Cards beyond
 *  that render the cover only. */
export function overlayOpacityForDistance(distance: number): number {
  return Math.max(0, Math.min(1, (OVERLAY_HALF_STEP - Math.abs(distance)) / OVERLAY_HALF_STEP));
}
