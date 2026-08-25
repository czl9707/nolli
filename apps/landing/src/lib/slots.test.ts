import { describe, expect, it } from "vitest"
import { INDEX_SLOT, indexSlot, slotRect } from "./slots"

describe("slotRect", () => {
  it("converts center/size to top-left edges", () => {
    const idx = slotRect(INDEX_SLOT)
    expect(idx.x).toBeCloseTo(0.29, 10)
    expect(idx.y).toBeCloseTo(0.275, 10)
    expect(idx.w).toBe(0.42)
    expect(idx.h).toBe(0.65)
  })
  it("is an exact inverse of the frame CSS calc (cx - w/2 etc.)", () => {
    const r = slotRect(INDEX_SLOT)
    expect(r.x + r.w / 2).toBeCloseTo(INDEX_SLOT.cx, 12)
    expect(r.y + r.h / 2).toBeCloseTo(INDEX_SLOT.cy, 12)
  })
  it("indexSlot behaves like a content container: max width, component padding", () => {
    // no window in tests — the CSS-var fallbacks (672 max, 32 pad) apply
    expect(indexSlot(1200).w * 1200).toBeCloseTo(672, 10)
    expect(indexSlot(2400).w * 2400).toBeCloseTo(672, 10)
    // narrow viewport: full width minus component padding per side
    expect(indexSlot(500).w * 500).toBeCloseTo(500 - 64, 10)
  })
})
