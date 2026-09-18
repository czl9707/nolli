import { describe, expect, it } from "vitest"
import { buildTimeline, crossedBoundary, targetHoldAt, TRIGGER_LEAD_VH, type SpineScene } from "./timeline"

const cam = { center: [12, 25] as [number, number], zoom: 1 }
const hold = (id: string, heightVh = 100): SpineScene => ({
  id, shape: `[data-spine-shape='${id}']`, heightVh, camera: cam,
  Component: () => null,
})

describe("buildTimeline", () => {
  it("lays out consecutive ranges and totals", () => {
    const t = buildTimeline([hold("hero", 200), hold("city", 200), hold("arch", 200)])
    expect(t.totalVh).toBe(600)
    expect(t.segments.map((s) => [s.scene.id, s.startVh, s.heightVh])).toEqual([
      ["hero", 0, 200], ["city", 200, 200], ["arch", 400, 200],
    ])
  })
  it("throws when a non-final hold is shorter than the trigger lead", () => {
    expect(() => buildTimeline([hold("a", TRIGGER_LEAD_VH - 1), hold("b")])).toThrow(/lead/)
  })
  it("allows a final hold of any height", () => {
    expect(() => buildTimeline([hold("a"), hold("b", 10)])).not.toThrow()
  })
})

describe("targetHoldAt", () => {
  const t = buildTimeline([hold("hero", 200), hold("city", 200), hold("arch", 200)])
  it("steps at start − lead, holding before it", () => {
    expect(targetHoldAt(t, 0)).toBe("hero")
    expect(targetHoldAt(t, 139.9)).toBe("hero")
    expect(targetHoldAt(t, 140)).toBe("city") // 200 − 60
    expect(targetHoldAt(t, 339.9)).toBe("city")
    expect(targetHoldAt(t, 340)).toBe("arch") // 400 − 60
  })
  it("clamps outside the timeline", () => {
    expect(targetHoldAt(t, -50)).toBe("hero")
    expect(targetHoldAt(t, 9999)).toBe("arch")
  })
  it("honors a custom lead", () => {
    expect(targetHoldAt(t, 180, 20)).toBe("city")
    expect(targetHoldAt(t, 179.9, 20)).toBe("hero")
  })
})

describe("crossedBoundary", () => {
  const t = buildTimeline([hold("hero", 200), hold("city", 200), hold("arch", 200)])
  it("reports the same boundary vh for forward and reverse fires across one edge", () => {
    expect(crossedBoundary(t, "hero", "city")).toEqual({ boundaryVh: 140, dir: 1 })
    expect(crossedBoundary(t, "city", "hero")).toEqual({ boundaryVh: 140, dir: -1 })
    expect(crossedBoundary(t, "city", "arch")).toEqual({ boundaryVh: 340, dir: 1 })
    expect(crossedBoundary(t, "arch", "city")).toEqual({ boundaryVh: 340, dir: -1 })
  })
  it("treats a null source as the first hold", () => {
    expect(crossedBoundary(t, null, "hero")).toEqual({ boundaryVh: -TRIGGER_LEAD_VH, dir: -1 })
    expect(crossedBoundary(t, null, "city")).toEqual({ boundaryVh: 140, dir: 1 })
  })
})
