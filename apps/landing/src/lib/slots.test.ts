import { describe, expect, it } from "vitest"
import { layerTargetFor } from "./slots"

describe("layerTargetFor", () => {
  it("covers the slot in both axes and centers it", () => {
    const slot = { cx: 0.7, cy: 0.4, w: 0.4, h: 0.6 }
    const t = layerTargetFor(slot, 1280, 800)
    expect(t.scale).toBe(0.6) // the larger dimension drives cover
    expect(t.x).toBeCloseTo(0.2)
    expect(t.y).toBeCloseTo(-0.1)
    // covered width in px: scale*vw = 0.6*1280 = 768 ≥ slot.w*vw = 512 ✓
  })
  it("never scales above 1", () => {
    const t = layerTargetFor({ cx: 0.5, cy: 0.5, w: 1.4, h: 0.5 }, 1000, 1000)
    expect(t.scale).toBeLessThanOrEqual(1) // slots are viewport-fraction sized; clamp here
  })
})
