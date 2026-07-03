import { describe, expect, it } from "vitest"
import { spotlightPanVector } from "./spotlight-framing"

describe("spotlightPanVector", () => {
  // Rule: pan the map CENTER toward the photo corner by 25% of each dimension.
  // After setCenter(building), building is at screen center; panBy then shifts
  // the camera so the building lands centered in the OPPOSITE quadrant.
  it("pans north-east (toward a top-right photo)", () => {
    expect(spotlightPanVector("top-right", 1000, 800)).toEqual([250, -200])
  })
  it("pans north-west (toward a top-left photo)", () => {
    expect(spotlightPanVector("top-left", 1000, 800)).toEqual([-250, -200])
  })
  it("pans south-east (toward a bottom-right photo)", () => {
    expect(spotlightPanVector("bottom-right", 1000, 800)).toEqual([250, 200])
  })
  it("pans south-west (toward a bottom-left photo)", () => {
    expect(spotlightPanVector("bottom-left", 1000, 800)).toEqual([-250, 200])
  })
})
