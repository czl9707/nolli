import { describe, expect, it } from "vitest"
import { buildTimeline, shapeAt, crossedBoundary, targetHoldAt, type PxRect, type SpineScene } from "./timeline"

const cam = { center: [12, 25] as [number, number], zoom: 1 }
const hold = (id: string, shape = `[data-spine-shape='${id}']`, heightVh = 100): SpineScene => ({
  kind: "hold", id, shape, heightVh, camera: cam,
  Component: () => null,
})
const morph = (id: string, fromShape: string, toShape: string, heightVh = 50): SpineScene => ({
  kind: "transition", id, fromShape, toShape, heightVh,
})

describe("buildTimeline", () => {
  it("lays out consecutive ranges and totals", () => {
    const t = buildTimeline([hold("a"), morph("m", "[data-spine-shape='a']", "[data-spine-shape='b']"), hold("b")])
    expect(t.totalVh).toBe(250)
    expect(t.segments.map((s) => [s.scene.id, s.startVh, s.heightVh])).toEqual([
      ["a", 0, 100], ["m", 100, 50], ["b", 150, 100],
    ])
  })
  it("rejects a transition whose shapes don't match its neighbours", () => {
    expect(() => buildTimeline([hold("a"), morph("m", "[data-spine-shape='x']", "[data-spine-shape='b']"), hold("b")]))
      .toThrow(/fromShape/)
    expect(() => buildTimeline([hold("a"), morph("m", "[data-spine-shape='a']", "[data-spine-shape='x']"), hold("b")]))
      .toThrow(/toShape/)
  })
  it("rejects adjacent holds with differing shapes", () => {
    expect(() => buildTimeline([hold("a"), hold("b")])).toThrow(/transition/)
  })
  it("allows adjacent fullscreen holds sharing one shape", () => {
    expect(() => buildTimeline([hold("a", "[data-spine-shape='screen']"), hold("b", "[data-spine-shape='screen']")]))
      .not.toThrow()
  })
  it("requires the spine to open with a hold", () => {
    expect(() => buildTimeline([morph("m", "[data-spine-shape='a']", "[data-spine-shape='b']"), hold("b")]))
      .toThrow(/open with a hold/)
  })
})

describe("targetHoldAt", () => {
  const t = buildTimeline([
    hold("hero", "[data-spine-shape='screen']", 200),
    hold("city", "[data-spine-shape='screen']", 200),
    morph("m", "[data-spine-shape='screen']", "[data-spine-shape='card']", 50),
    hold("card", "[data-spine-shape='card']", 200),
  ])
  it("steps at hold starts, holding between", () => {
    expect(targetHoldAt(t, 0)).toBe("hero")
    expect(targetHoldAt(t, 199.9)).toBe("hero")
    expect(targetHoldAt(t, 200)).toBe("city")
    expect(targetHoldAt(t, 399.9)).toBe("city")
    // inside the transition the allegiance is already the hold it morphs toward
    expect(targetHoldAt(t, 400)).toBe("card")
    expect(targetHoldAt(t, 449.9)).toBe("card")
    expect(targetHoldAt(t, 450)).toBe("card")
  })
  it("clamps outside the timeline", () => {
    expect(targetHoldAt(t, -50)).toBe("hero")
    expect(targetHoldAt(t, 9999)).toBe("card")
  })
})

describe("crossedBoundary", () => {
  const t = buildTimeline([
    hold("hero", "[data-spine-shape='screen']", 200),
    hold("city", "[data-spine-shape='screen']", 200),
    morph("m", "[data-spine-shape='screen']", "[data-spine-shape='card']", 50),
    hold("card", "[data-spine-shape='card']", 200),
  ])
  it("keys same-shape edges on the later hold's start", () => {
    expect(crossedBoundary(t, "hero", "city")).toEqual({ boundaryVh: 200, dir: 1 })
    expect(crossedBoundary(t, "city", "hero")).toEqual({ boundaryVh: 200, dir: -1 })
  })
  it("keys morph edges on the transition's start", () => {
    expect(crossedBoundary(t, "city", "card")).toEqual({ boundaryVh: 400, dir: 1 })
    expect(crossedBoundary(t, "card", "city")).toEqual({ boundaryVh: 400, dir: -1 })
  })
})

describe("shapeAt", () => {
  const rect = (top: number, height: number): PxRect => ({ left: 0, top, width: 100, height })
  const live = { "[data-spine-shape='screen']": rect(0, 100), "[data-spine-shape='card']": rect(10, 50) }
  const t = buildTimeline([
    hold("a", "[data-spine-shape='screen']", 100),
    morph("m", "[data-spine-shape='screen']", "[data-spine-shape='card']", 100),
    hold("b", "[data-spine-shape='card']", 100),
  ])
  it("holds take the live rect", () => {
    expect(shapeAt(t, 50, live)).toEqual(live["[data-spine-shape='screen']"])
    expect(shapeAt(t, 200, live)).toEqual(live["[data-spine-shape='card']"])
  })
  it("transitions lerp the live rects across the span — seams continuous", () => {
    expect(shapeAt(t, 100, live)).toEqual(live["[data-spine-shape='screen']"])
    expect(shapeAt(t, 150, live)).toEqual({ left: 0, top: 5, width: 100, height: 75 })
    expect(shapeAt(t, 199.9, live).top).toBeCloseTo(10, 1)
  })
  it("clamps past the transition's ends", () => {
    expect(shapeAt(t, 90, live)).toEqual(live["[data-spine-shape='screen']"])
    expect(shapeAt(t, 500, live)).toEqual(live["[data-spine-shape='card']"])
  })
})
