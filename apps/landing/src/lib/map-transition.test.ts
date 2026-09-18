import { describe, expect, it, vi } from "vitest"
import { applyMapTransition, SNAPSHOT_SHAPE_MS } from "./map-transition"

const cam = { center: [0, 0] as [number, number], zoom: 3.4 }

// node env: stub the DOM surface the sequence touches — the veil <img>
// (with the reflow read), the snapshot <canvas>, and the container
const ctx = new Proxy({}, { get: () => vi.fn() }) as never
const fakeDocument = {
  createElement: (tag: string) => {
    const el: Record<string, unknown> = {
      style: {}, src: "", remove: () => {},
      getBoundingClientRect: () => ({}),
    }
    if (tag === "canvas")
      return Object.assign(el, { width: 0, height: 0, getContext: () => ctx, toDataURL: () => "data:" })
    return el
  },
}
;(globalThis as never as { document?: unknown }).document ??= fakeDocument

function fakeMap() {
  const canvas = { width: 100, height: 80 }
  const container = { clientWidth: 1000, clientHeight: 800, appendChild: vi.fn() }
  const map = {
    project: () => ({ x: 10, y: 10 }),
    getZoom: () => 3,
    getBounds: () => ({ contains: () => true }),
    getContainer: () => container,
    getCanvas: () => canvas,
    jumpTo: vi.fn(),
    once: () => {}, off: () => {},
  }
  return { map, jumpTo: map.jumpTo }
}

describe("applyMapTransition", () => {
  it("runs the jump flow on the shape morph's clock", async () => {
    const { map, jumpTo } = fakeMap()
    applyMapTransition(map as never, cam)
    expect(jumpTo).not.toHaveBeenCalled()
    await new Promise((res) => setTimeout(res, SNAPSHOT_SHAPE_MS + 100))
    expect(jumpTo).toHaveBeenCalledWith({ center: cam.center, zoom: cam.zoom })
  }, 10_000)

  it("superseded sequences never jump to their stale target", async () => {
    const { map, jumpTo } = fakeMap()
    applyMapTransition(map as never, cam)
    const later = { center: [9, 9] as [number, number], zoom: 5 }
    applyMapTransition(map as never, later)
    await new Promise((res) => setTimeout(res, SNAPSHOT_SHAPE_MS + 100))
    const calls = jumpTo.mock.calls.map((c) => c[0])
    expect(calls).toEqual([{ center: later.center, zoom: later.zoom }])
  }, 10_000)
})
