export type FocusDecision = "none" | "now" | "debounce"

export interface FocusInput {
  /** MapLibre instance exists AND style is loaded. */
  mapReady: boolean
  /** lat/lng are finite and in range. */
  valid: boolean
  /** Current lat/lng exactly equal the last coord we flew to. */
  sameAsLastFlown: boolean
  /** Has any fly completed since mount? */
  hasFlown: boolean
}

/**
 * Decide whether the map should fly to the current coordinate.
 *
 * - "none": do nothing (map not ready, coord invalid, or no-op re-fly).
 * - "now": fly immediately (the first qualifying fly after mount).
 * - "debounce": fly after a short debounce (every subsequent qualifying fly,
 *   so rapid typing doesn't jitter the camera).
 *
 * Note: this function does NOT know about map clicks. Click suppression is
 * handled by the caller via a time window, because a click writes lat and lng
 * in two separate setValue calls that the caller's effect may observe mid-flush.
 */
export function decideFocus(i: FocusInput): FocusDecision {
  if (!i.mapReady) return "none"
  if (!i.valid) return "none"
  if (i.sameAsLastFlown) return "none"
  if (!i.hasFlown) return "now"
  return "debounce"
}
