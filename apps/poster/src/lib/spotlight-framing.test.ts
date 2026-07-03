import { describe, expect, it } from "vitest"
import { spotlightPanVector } from "./spotlight-framing"

describe("spotlightPanVector", () => {
  // Rule: pan the map CENTER toward the photo side by 25% of that dimension.
  // After setCenter(building), building is at screen center; panBy then shifts
  // the camera so the building lands centered in the OPPOSITE half.
  it("pans east (toward a right-side photo)", () => {
    expect(spotlightPanVector("right", 1000, 800)).toEqual([250, 0])
  })
  it("pans west (toward a left-side photo)", () => {
    expect(spotlightPanVector("left", 1000, 800)).toEqual([-250, 0])
  })
  it("pans north (toward a top photo)", () => {
    expect(spotlightPanVector("top", 1000, 800)).toEqual([0, -200])
  })
  it("pans south (toward a bottom photo)", () => {
    expect(spotlightPanVector("bottom", 1000, 800)).toEqual([0, 200])
  })
})
