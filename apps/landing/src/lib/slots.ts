export type Slot = { cx: number; cy: number; w: number; h: number }

export type SlotRect = { x: number; y: number; w: number; h: number }

export const INDEX_SLOT: Slot = { cx: 0.5, cy: 0.55, w: 0.42, h: 0.66 }

/** Cap on the index plate's px width, like the app's content container —
 * past this width the plate stops growing with the viewport. */
export const INDEX_SLOT_MAX_W = 672

/** INDEX_SLOT with the container cap applied at a given viewport width. */
export function indexSlot(vw: number): Slot {
  return { ...INDEX_SLOT, w: Math.min(INDEX_SLOT.w, INDEX_SLOT_MAX_W / vw) }
}

export const CLOSEUP_SLOT: Slot = { cx: 0.3, cy: 0.5, w: 0.26, h: 0.34 }

/** Slot as a viewport-fraction rect with x/y = top-left edges (the layer
 * geometry the map plate settles into at dwell). */
export function slotRect(slot: Slot): SlotRect {
  return { x: slot.cx - slot.w / 2, y: slot.cy - slot.h / 2, w: slot.w, h: slot.h }
}
