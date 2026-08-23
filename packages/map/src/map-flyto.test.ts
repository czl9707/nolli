import { describe, expect, it, vi } from "vitest"
import { flyToSceneCinematic } from "./map-flyto"

function fakeMap(opts: { contains: boolean; zoom?: number }) {
  const zoom = opts.zoom ?? 10
  return {
    getZoom: () => zoom,
    getBounds: () => ({ contains: () => opts.contains }),
    stop: vi.fn(),
    easeTo: vi.fn(),
  } as unknown as Parameters<typeof flyToSceneCinematic>[0]
}

describe("flyToSceneCinematic", () => {
  it("short duration when target is in bounds, plus zoom-delta padding", () => {
    const map = fakeMap({ contains: true, zoom: 10 })
    flyToSceneCinematic(map, { center: [2, 48], zoom: 15.6 })
    const arg = vi.mocked(map.easeTo).mock.calls[0][0]
    expect(arg.duration).toBe(600 + 5.6 * 200)
    expect(arg.center).toEqual([2, 48])
    expect(arg.zoom).toBe(15.6)
    expect(arg.easing).toBeTypeOf("function")
  })

  it("long duration when target out of bounds; zoom-out passes through", () => {
    const map = fakeMap({ contains: false, zoom: 15.6 })
    flyToSceneCinematic(map, { center: [10, 25], zoom: 1.5 })
    const arg = vi.mocked(map.easeTo).mock.calls[0][0]
    expect(arg.duration).toBe(1800)
    expect(arg.zoom).toBe(1.5)
  })

  it("stops any in-flight move first", () => {
    const map = fakeMap({ contains: true })
    flyToSceneCinematic(map, { center: [0, 0], zoom: 3 })
    expect(map.stop).toHaveBeenCalledBefore(map.easeTo as never)
  })
})
