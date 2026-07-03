import { describe, expect, it } from "vitest"
import { spotlightPanVector } from "./spotlight-framing"

describe("spotlightPanVector", () => {
  // 10% of a 1000×800 canvas → qx=100, qy=80. The vector points TOWARD the
  // photo corner: up is −y, left is −x.
  const w = 1000
  const h = 800

  it("top-right → pan toward +x, up", () => {
    expect(spotlightPanVector("top-right", w, h)).toEqual([100, -80])
  })

  it("top-left → pan toward −x, up", () => {
    expect(spotlightPanVector("top-left", w, h)).toEqual([-100, -80])
  })

  it("bottom-right → pan toward +x, down", () => {
    expect(spotlightPanVector("bottom-right", w, h)).toEqual([100, 80])
  })

  it("bottom-left → pan toward −x, down", () => {
    expect(spotlightPanVector("bottom-left", w, h)).toEqual([-100, 80])
  })
})
