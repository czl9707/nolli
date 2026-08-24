import { CANVAS_W, CANVAS_H, MAP_SLOT_W, MAP_SLOT_H, MAP_SLOT_X, MAP_SLOT_Y } from "@nolli/board"

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

export const CLOSEUP_SLOT: Slot = { cx: 0.3, cy: 0.5, w: 0.26, h: 0.34 }

/** The closeup scene is the app's arch pin-board: the CANVAS_W×CANVAS_H
 * surface fit into the viewport. One source of truth for the fit — the
 * scene's board div and the stage's map-slot rect must agree exactly. Wide
 * viewports reserve a left column for the pinned carousel chrome; below it
 * the chrome overlays the board (mobile snap). */
const CHROME_W = 380
export function boardFit(vw: number, vh: number): { s: number; ox: number; oy: number } {
  const side = vw > 900 ? CHROME_W : 0
  const s = Math.min((vw - side) / CANVAS_W, vh / CANVAS_H)
  return { s, ox: side + (vw - side - CANVAS_W * s) / 2, oy: (vh - CANVAS_H * s) / 2 }
}

/** The map item = the canvas' site-map slot, resolved against the viewport.
 * Per-arch relocation is NOT in here — it's a px translate on top of this
 * rect (stage --board-shift-*), so the scroll-driven layer stays static. */
export function closeupSlot(vw: number, vh: number): Slot {
  const { s, ox, oy } = boardFit(vw, vh)
  const x = ox + MAP_SLOT_X * s
  const y = oy + MAP_SLOT_Y * s
  const w = MAP_SLOT_W * s
  const h = MAP_SLOT_H * s
  return { cx: (x + w / 2) / vw, cy: (y + h / 2) / vh, w: w / vw, h: h / vh }
}

/** Slot as a viewport-fraction rect with x/y = top-left edges (the layer
 * geometry the map plate settles into at dwell). */
export function slotRect(slot: Slot): SlotRect {
  return { x: slot.cx - slot.w / 2, y: slot.cy - slot.h / 2, w: slot.w, h: slot.h }
}
