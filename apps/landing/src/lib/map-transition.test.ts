import { describe, expect, it, vi } from "vitest"
import { applyMapTransition } from "./map-transition"

const cam = { center: [0, 0] as [number, number], zoom: 3.4 }

function fakeMap(center: [number, number], zoom: number) {
  const map = {
    getCenter: () => ({ lng: center[0], lat: center[1] }),
    getZoom: () => zoom,
    getBounds: () => ({ contains: () => true }),
    stop: vi.fn(),
    flyTo: vi.fn(),
  }
  return { map, flyTo: map.flyTo, stop: map.stop }
}

describe("applyMapTransition", () => {
  it("flies to the target camera on the arc", () => {
    const { map, flyTo, stop } = fakeMap([10, 10], 3)
    applyMapTransition(map as never, cam)
    expect(stop).toHaveBeenCalled()
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: cam.center,
        zoom: cam.zoom,
        duration: expect.any(Number),
        curve: expect.any(Number),
      }),
    )
  })

  it("is a no-op when the view already sits at the target", () => {
    const { map, flyTo, stop } = fakeMap(cam.center, cam.zoom)
    applyMapTransition(map as never, cam)
    expect(stop).not.toHaveBeenCalled()
    expect(flyTo).not.toHaveBeenCalled()
  })

  it("flies straight (no dip) when the flight touches world-scale zooms", () => {
    const { map, flyTo } = fakeMap([10, 10], 5)
    applyMapTransition(map as never, { center: [12, 25], zoom: 1.05 })
    expect(flyTo).toHaveBeenCalledWith(expect.objectContaining({ curve: 1 }))
  })
})
