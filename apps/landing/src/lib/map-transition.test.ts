import { describe, expect, it, vi } from "vitest"
import { applyMapTransition } from "./map-transition"

const cam = { center: [0, 0] as [number, number], zoom: 3.4 }

function fakeMap(center: [number, number], zoom: number) {
  const handlers: Record<string, () => void> = {}
  const map = {
    getCenter: () => ({ lng: center[0], lat: center[1] }),
    getZoom: () => zoom,
    getBounds: () => ({ contains: () => true }),
    stop: vi.fn(),
    easeTo: vi.fn(),
    jumpTo: vi.fn(),
    once: vi.fn((ev: string, fn: () => void) => { handlers[ev] = fn }),
  }
  return { map, easeTo: map.easeTo, jumpTo: map.jumpTo, stop: map.stop, moveend: () => handlers.moveend?.() }
}

describe("applyMapTransition", () => {
  it("eases to the target camera", () => {
    const { map, easeTo, stop } = fakeMap([10, 10], 3)
    applyMapTransition(map as never, cam)
    expect(stop).toHaveBeenCalled()
    expect(easeTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: cam.center,
        zoom: cam.zoom,
        duration: expect.any(Number),
        easing: expect.any(Function),
      }),
    )
  })

  it("is a no-op when the view already sits at the target", () => {
    const { map, easeTo, stop } = fakeMap(cam.center, cam.zoom)
    applyMapTransition(map as never, cam)
    expect(stop).not.toHaveBeenCalled()
    expect(easeTo).not.toHaveBeenCalled()
  })

  it("pins the camera when the flight lands off-target", () => {
    // a landed camera short of the target (the clamp / a resize during the
    // flight) snaps to it at moveend
    const { map, easeTo, jumpTo, moveend } = fakeMap([10, 10], 3)
    easeTo.mockImplementation(() => {})
    applyMapTransition(map as never, cam)
    map.getCenter = () => ({ lng: 0.5, lat: 0.5 })
    map.getZoom = () => 3.2
    moveend()
    expect(jumpTo).toHaveBeenCalledWith({ center: cam.center, zoom: cam.zoom })
  })

  it("leaves a correctly landed camera alone", () => {
    const { map, easeTo, jumpTo, moveend } = fakeMap([10, 10], 3)
    applyMapTransition(map as never, cam)
    map.getCenter = () => ({ lng: cam.center[0], lat: cam.center[1] })
    map.getZoom = () => cam.zoom
    moveend()
    expect(jumpTo).not.toHaveBeenCalled()
  })
})
