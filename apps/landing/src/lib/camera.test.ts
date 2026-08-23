import { describe, expect, it } from "vitest"
import { fitCamera } from "./camera"

describe("fitCamera", () => {
  it("centers on the bounds and zooms to fit the tighter axis", () => {
    // five Paris-ish points spanning ~0.2° lng / ~0.08° lat
    const pts = [
      { lng: 2.29, lat: 48.86 },
      { lng: 2.36, lat: 48.86 },
      { lng: 2.42, lat: 48.84 },
      { lng: 2.33, lat: 48.8 },
      { lng: 2.39, lat: 48.82 },
    ]
    const cam = fitCamera(pts, { width: 800, height: 620 })
    expect(cam.center[0]).toBeCloseTo(2.355, 3)
    // asymmetric padding (cards hang below their pin) parks the camera
    // south of the bounds midpoint, but still near the picks
    expect(cam.center[1]).toBeGreaterThan(48.75)
    expect(cam.center[1]).toBeLessThan(48.84)
    // city-scale span in a card-slot viewport lands around city zoom
    expect(cam.zoom).toBeGreaterThan(10)
    expect(cam.zoom).toBeLessThan(13)
  })

  it("single point zooms in to the cap; center shifted south for card hang", () => {
    const cam = fitCamera([{ lng: 2.35, lat: 48.85 }], { width: 800, height: 620 })
    expect(cam.center[0]).toBeCloseTo(2.35, 6)
    // bottom padding > top padding pulls the camera south of the point
    expect(cam.center[1]).toBeLessThan(48.85)
    expect(cam.center[1]).toBeGreaterThan(48.84)
    expect(cam.zoom).toBe(18)
  })
})
