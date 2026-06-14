/** Shared animation timing — keep in sync with --transition-* in global.css */
export const TRANSITION_INSTANT = 0.15
export const TRANSITION_SHORT = 0.6
export const TRANSITION_LONG = 1.2

/** Base delay before board items start appearing */
export const DELAY_START = 0.3

/** Stagger between consecutive items */
export const ITEM_STAGGER = 0.1

/**
 * Cluster pin spread / collapse animation. Pins animate longitude/latitude
 * (via marker.setLngLat), never screen pixels.
 */
export const CLUSTER_SPREAD_DURATION = TRANSITION_SHORT // travel time for one pin (s)
export const CLUSTER_SPREAD_MAX_DELAY = 0.12 // max random per-pin start delay (s)
export const CLUSTER_SPREAD_EASE: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
] // easeOutQuint-ish cubic bezier
