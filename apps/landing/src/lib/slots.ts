import type { LayerKey } from "./spine"

export type Slot = { cx: number; cy: number; w: number; h: number }

export const INDEX_SLOT: Slot = { cx: 0.62, cy: 0.55, w: 0.42, h: 0.66 }

export const CLOSEUP_SLOT: Slot = { cx: 0.3, cy: 0.5, w: 0.26, h: 0.34 }

export function layerTargetFor(slot: Slot, vw: number, vh: number): LayerKey {
  void vw
  void vh
  return {
    scale: Math.min(1, Math.max(slot.w, slot.h)),
    x: slot.cx - 0.5,
    y: slot.cy - 0.5,
  }
}
