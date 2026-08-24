export type Slot = { cx: number; cy: number; w: number; h: number }

export type SlotRect = { x: number; y: number; w: number; h: number }

export const INDEX_SLOT: Slot = { cx: 0.5, cy: 0.55, w: 0.42, h: 0.66 }

/** Read a length CSS var from the shared @nolli/ui tokens as px (rem resolves
 * against the root font size). Falls back outside the browser (tests). */
function cssVarPx(name: string, fallback: number): number {
  if (typeof getComputedStyle === "undefined") return fallback
  const raw = getComputedStyle(document.body).getPropertyValue(name).trim()
  const m = /^([\d.]+)(rem|px)$/.exec(raw)
  if (!m) return fallback
  if (m[2] === "px") return parseFloat(m[1])
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return parseFloat(m[1]) * root
}

/** Index plate sizing like the app's content container: full width minus
 * component padding per side, capped at --landing-plate-max (landing
 * global.css — 42rem, 1.5x above the lg breakpoint). Read per call so
 * crossing the breakpoint re-applies on resize. */
export function indexSlot(vw: number): Slot {
  const max = cssVarPx("--landing-plate-max", 672)
  const pad = cssVarPx("--spacing-component", 32)
  return { ...INDEX_SLOT, w: Math.min((vw - pad * 2) / vw, max / vw) }
}

/** Slot as a viewport-fraction rect with x/y = top-left edges (the layer
 * geometry the map plate settles into at dwell). */
export function slotRect(slot: Slot): SlotRect {
  return { x: slot.cx - slot.w / 2, y: slot.cy - slot.h / 2, w: slot.w, h: slot.h }
}
