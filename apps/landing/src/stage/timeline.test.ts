import { describe, expect, it } from "vitest"
import { buildTimeline, cameraAtVh, layerAt, snapVh } from "./timeline"
import type { Scene } from "@/lib/scene"

const full = { x: 0, y: 0, w: 1, h: 1 }
const slot = { x: 0.29, y: 0.275, w: 0.42, h: 0.65 }

// mirrors the real landing spine: hero 180 / index 200 / cta 160
const mk = (): Scene[] => [
  {
    id: "hero",
    heightVh: 180,
    keyframes: [
      { at: 0, layer: full },
      { at: 108, layer: full },
    ],
    Component: () => null,
  },
  {
    id: "index",
    heightVh: 200,
    keyframes: [
      { at: 0, layer: slot },
      { at: 120, layer: slot },
    ],
    Component: () => null,
  },
  {
    id: "cta",
    heightVh: 160,
    keyframes: [
      { at: 0, layer: full },
      { at: 96, layer: full },
    ],
    Component: () => null,
  },
]

const tl = () => buildTimeline(mk())

const eqRect = (got: { x: number; y: number; w: number; h: number }, want: { x: number; y: number; w: number; h: number }) => {
  for (const k of ["x", "y", "w", "h"] as const) expect(got[k]).toBeCloseTo(want[k], 10)
}

describe("buildTimeline", () => {
  it("lays keyframes out at global vh offsets and sums heights", () => {
    const t = tl()
    expect(t.totalVh).toBe(540)
    expect(t.keyframes.map((k) => k.atVh)).toEqual([0, 108, 180, 300, 380, 476])
  })
  it("defaults height to last keyframe + 20vh tail", () => {
    const t = buildTimeline([
      { id: "s", keyframes: [{ at: 50, layer: full }], Component: () => null },
    ])
    expect(t.totalVh).toBe(70)
  })
  it("drops a duplicate-at keyframe, keeping the later one", () => {
    const t = buildTimeline([
      {
        id: "s",
        keyframes: [
          { at: 0, layer: full },
          { at: 0, layer: slot },
        ],
        Component: () => null,
      },
    ])
    expect(t.keyframes).toHaveLength(1)
    expect(t.keyframes[0].layer).toBe(slot)
  })
})

describe("layerAt", () => {
  it("holds a keyframe through its dwell segment", () => {
    eqRect(layerAt(tl(), 50), full) // hero dwell
    eqRect(layerAt(tl(), 240), slot) // index dwell
  })
  it("morphs across the transition segment with easeInOutCubic", () => {
    // hero→index segment 108..180; midpoint t=0.5, eased 0.5
    const r = layerAt(tl(), 144)
    eqRect(r, { x: 0.145, y: 0.1375, w: 0.71, h: 0.825 })
  })
  it("applies eased (not linear) value inside a segment", () => {
    // t = 0.25 → easeInOutCubic = 4·0.25³ = 0.0625
    const r = layerAt(tl(), 126)
    expect(r.w).toBeCloseTo(1 - 0.0625 * (1 - 0.42), 10)
  })
  it("clamps out-of-range vh", () => {
    eqRect(layerAt(tl(), -10), full)
    eqRect(layerAt(tl(), 9999), full)
  })
  it("stays a valid rect at every step", () => {
    for (let vh = 0; vh <= 540; vh += 2) {
      const r = layerAt(tl(), vh)
      expect(r.x + r.w).toBeLessThanOrEqual(1.0001)
      expect(r.y + r.h).toBeLessThanOrEqual(1.0001)
    }
  })
})

describe("cameraAtVh", () => {
  it("returns the latest crossed camera keyframe", () => {
    const camA = { center: [2.35, 48.86] as [number, number], zoom: 11 }
    const camB = { center: [10, 25] as [number, number], zoom: 1.5 }
    const t = buildTimeline([
      {
        id: "s",
        heightVh: 100,
        keyframes: [
          { at: 0, layer: full, camera: camA },
          { at: 100, layer: full, camera: camB },
        ],
        Component: () => null,
      },
    ])
    expect(cameraAtVh(t, 0)).toBe(camA)
    expect(cameraAtVh(t, 50)).toBe(camA)
    expect(cameraAtVh(t, 100)).toBe(camB)
    expect(cameraAtVh(t, 150)).toBe(camB)
  })
  it("returns undefined when no camera keyframe exists", () => {
    expect(cameraAtVh(tl(), 300)).toBeUndefined()
  })
})

describe("snapVh", () => {
  it("quantizes to the nearest keyframe", () => {
    expect(snapVh(tl(), 24)).toBe(0)
    expect(snapVh(tl(), 60)).toBe(108)
    expect(snapVh(tl(), 530)).toBe(476)
  })
})
