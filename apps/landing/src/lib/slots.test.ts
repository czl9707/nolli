import { describe, expect, it } from "vitest"
import { CLOSEUP_SLOT, INDEX_SLOT, slotRect } from "./slots"

describe("slotRect", () => {
  it("converts center/size to top-left edges", () => {
    const idx = slotRect(INDEX_SLOT)
    expect(idx.x).toBeCloseTo(0.41, 10)
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
})
