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
 * Click suppression is NOT handled here — the caller applies a time window,
 * because a click writes lat and lng in two separate setValue calls that the
 * effect may observe mid-flush.
 */
export function decideFocus(i: FocusInput): FocusDecision {
  if (!i.mapReady) return "none"
  if (!i.valid) return "none"
  if (i.sameAsLastFlown) return "none"
  if (!i.hasFlown) return "now"
  return "debounce"
}
