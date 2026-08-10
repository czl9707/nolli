// Vertical cyclic card-carousel geometry + math (1920×1080 composition).
// Pure: no React, no Remotion. The CardCarousel component consumes these.

/** Focused card size: 4:5 portrait. Fits the right-side bg zone with breathing
 *  room left of the map's ~70% edge. */
export const CARD_W = 460;
export const CARD_H = 575;
/** Vertical gap between stack layers — 0.38× height → tight, heavy overlap. */
export const CARD_PITCH = Math.round(CARD_H * 0.38);
/** Render cards whose cyclic distance is within this. */
export const CARD_WINDOW = 3;
/** Opacity reaches 0 at this distance. */
export const CARD_FALLOFF = 3;
/** Scale shrinks by this per unit distance from center. */
export const CARD_SCALE_STEP = 0.12;
/** z-index base for the centered card; receding cards step down from here. */
export const CARD_Z_BASE = 100;
export const CARD_Z_STEP = 10;

export type CarouselCardState = {
  index: number;
  /** Signed cyclic distance from the focused position (negative = above center). */
  distance: number;
  opacity: number;
  scale: number;
  /** Vertical px offset from center (negative = up). */
  offsetY: number;
  zIndex: number;
  visible: boolean;
};

/** Shortest signed cyclic distance from `i` to `position` around a ring of `count`. */
export function cyclicDistance(i: number, position: number, count: number): number {
  if (count <= 0) return 0;
  let d = (((i - position) % count) + count) % count; // [0, count)
  if (d > count / 2) d -= count; // (-count/2, count/2]
  return d;
}

/** Resolve one card's stack state given the fractional focused `position`. */
export function carouselCard(i: number, position: number, count: number): CarouselCardState {
  const d = cyclicDistance(i, position, count);
  const ad = Math.abs(d);
  return {
    index: i,
    distance: d,
    opacity: Math.max(0, 1 - ad / CARD_FALLOFF),
    scale: 1 - CARD_SCALE_STEP * ad,
    offsetY: Math.round(d * CARD_PITCH),
    zIndex: CARD_Z_BASE - Math.round(ad * CARD_Z_STEP),
    visible: ad <= CARD_WINDOW,
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
