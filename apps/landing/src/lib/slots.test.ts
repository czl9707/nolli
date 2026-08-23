import { describe, expect, it } from "vitest"
import { CLOSEUP_SLOT, INDEX_SLOT, INDEX_SLOT_MAX_W, indexSlot, slotRect } from "./slots"

describe("slotRect", () => {
  it("converts center/size to top-left edges", () => {
    const idx = slotRect(INDEX_SLOT)
    expect(idx.x).toBeCloseTo(0.29, 10)
    expect(idx.y).toBeCloseTo(0.22, 10)
    expect(idx.w).toBe(0.42)
    expect(idx.h).toBe(0.66)
    const cl = slotRect(CLOSEUP_SLOT)
    expect(cl.x).toBeCloseTo(0.17, 10)
    expect(cl.y).toBeCloseTo(0.33, 10)
    expect(cl.w).toBe(0.26)
    expect(cl.h).toBe(0.34)
  })
  it("is an exact inverse of the frame CSS calc (cx - w/2 etc.)", () => {
    for (const slot of [INDEX_SLOT, CLOSEUP_SLOT]) {
      const r = slotRect(slot)
      expect(r.x + r.w / 2).toBeCloseTo(slot.cx, 12)
      expect(r.y + r.h / 2).toBeCloseTo(slot.cy, 12)
    }
  })
  it("indexSlot caps the plate px width at the container max", () => {
    // narrow viewport: proportional, under the cap
    expect(indexSlot(1200).w).toBeCloseTo(0.42, 10)
    expect(indexSlot(1200).w * 1200).toBeLessThan(INDEX_SLOT_MAX_W)
    // wide viewport: capped
    expect(indexSlot(2400).w * 2400).toBeCloseTo(INDEX_SLOT_MAX_W, 10)
  })
})
