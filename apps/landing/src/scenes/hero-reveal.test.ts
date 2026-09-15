import { describe, expect, it } from "vitest"
import { plateSize } from "./hero-reveal"

const FULL = { w: 480, h: 280 }

describe("plateSize", () => {
  it("stays at the full plate on wide viewports", () => {
    expect(plateSize(1280)).toEqual(FULL)
    expect(plateSize(576)).toEqual(FULL)
  })

  it("shrinks with narrow viewports, keeping the aspect", () => {
    const { w, h } = plateSize(520)
    expect(w).toBe(424)
    expect(h).toBe(Math.round((424 * FULL.h) / FULL.w))
    expect(plateSize(375).w).toBe(279)
  })

  it("never collapses below the floor", () => {
    expect(plateSize(300).w).toBe(240)
    expect(plateSize(0).w).toBe(240)
  })
})
