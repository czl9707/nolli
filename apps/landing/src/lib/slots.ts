export type Slot = { cx: number; cy: number; w: number; h: number }

export type SlotRect = { x: number; y: number; w: number; h: number }

export const INDEX_SLOT: Slot = { cx: 0.5, cy: 0.55, w: 0.42, h: 0.66 }

/** Read a length CSS var from the shared @nolli/ui tokens as px (rem resolves
 * against the root font size). Falls back outside the browser (tests). */
function cssVarPx(name: string, fallback: number): number {
  if (typeof window === "undefined") return fallback
  const raw = getComputedStyle(document.body).getPropertyValue(name).trim()
  const m = /^([\d.]+)(rem|px)$/.exec(raw)
  if (!m) return fallback
  if (m[2] === "px") return parseFloat(m[1])
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return parseFloat(m[1]) * root
}

/** Index plate sizing like the app's content container (--size-content-max,
 * --spacing-component from @nolli/ui): full width minus component padding
 * per side, capped at the max. Holds the max on desktop, shrinks with
 * padding intact on narrow viewports. */
export const INDEX_SLOT_MAX_W = cssVarPx("--size-content-max", 672)
export const INDEX_SLOT_PAD = cssVarPx("--spacing-component", 32)

/** INDEX_SLOT with the container rule applied at a given viewport width. */
export function indexSlot(vw: number): Slot {
  return { ...INDEX_SLOT, w: Math.min((vw - INDEX_SLOT_PAD * 2) / vw, INDEX_SLOT_MAX_W / vw) }
}

export const CLOSEUP_SLOT: Slot = { cx: 0.3, cy: 0.5, w: 0.26, h: 0.34 }

/** Slot as a viewport-fraction rect with x/y = top-left edges (the layer
 * geometry the map plate settles into at dwell). */
export function slotRect(slot: Slot): SlotRect {
  return { x: slot.cx - slot.w / 2, y: slot.cy - slot.h / 2, w: slot.w, h: slot.h }
}
