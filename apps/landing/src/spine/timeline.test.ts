import { describe, expect, it } from "vitest"
import { buildTimeline, ownerHoldAt, shapeAt, type HoldScene, type SpineScene } from "./timeline"

const cam = { center: [12, 25] as [number, number], zoom: 1 }
const hold = (id: string, heightVh = 100): HoldScene => ({
  kind: "hold",
  id, shape: `[data-spine-shape='${id}']`, heightVh, camera: cam,
  Component: () => null,
})
const transition = (id: string, from: string, to: string, heightVh = 60, overrunVh?: number): SpineScene => ({
  kind: "transition", id, fromShape: `[data-spine-shape='${from}']`,
  toShape: `[data-spine-shape='${to}']`, heightVh, overrunVh,
})

const rect = (n: number): Record<string, { left: number; top: number; width: number; height: number }> => ({
  "[data-spine-shape='hero']": { left: 0, top: n, width: 100, height: 100 },
  "[data-spine-shape='city']": { left: 10, top: n + 10, width: 50, height: 50 },
  "[data-spine-shape='arch']": { left: 20, top: n + 20, width: 200, height: 200 },
})

describe("buildTimeline", () => {
  it("lays out consecutive ranges and totals", () => {
    const t = buildTimeline([hold("hero", 200), transition("t1", "hero", "city"), hold("city", 200)])
    expect(t.totalVh).toBe(460)
    expect(t.segments.map((s) => [s.scene.id, s.startVh, s.heightVh])).toEqual([
      ["hero", 0, 200], ["t1", 200, 60], ["city", 260, 200],
    ])
  })
  it("throws when a transition's shapes do not match its neighbours", () => {
    expect(() => buildTimeline([hold("a"), transition("t", "a", "b"), hold("c")])).toThrow(/toShape/)
    expect(() => buildTimeline([hold("a"), transition("t", "c", "b"), hold("b")])).toThrow(/fromShape/)
  })
  it("throws when differing holds sit next to each other without a transition", () => {
    expect(() => buildTimeline([hold("a"), hold("b")])).toThrow(/transition/)
  })
})

describe("shapeAt", () => {
  const t = buildTimeline([hold("hero", 200), transition("t", "hero", "city", 60), hold("city", 200)])
  it("holds are constant; transitions lerp linearly", () => {
    expect(shapeAt(t, 100, rect(0))).toEqual(rect(0)["[data-spine-shape='hero']"])
    expect(shapeAt(t, 230, rect(0))).toEqual({ left: 5, top: 5, width: 75, height: 75 })
    expect(shapeAt(t, 260, rect(0))).toEqual(rect(0)["[data-spine-shape='city']"])
  })
  it("clamps past the segment ends", () => {
    expect(shapeAt(t, -50, rect(0))).toEqual(rect(0)["[data-spine-shape='hero']"])
    expect(shapeAt(t, 9999, rect(0))).toEqual(rect(0)["[data-spine-shape='city']"])
  })
})

describe("shapeAt with an overrun tail", () => {
  // band 60 + tail 40 — the morph spans 100vh, ending inside the city hold
  const t = buildTimeline([hold("hero", 200), transition("t", "hero", "city", 60, 40), hold("city", 200)])
  const at = (v: number) => shapeAt(t, v, rect(0))
  it("lerps at one rate across band and tail", () => {
    expect(at(250)).toEqual({ left: 5, top: 5, width: 75, height: 75 })
  })
  it("the tail keeps morphing inside the next hold's domain", () => {
    expect(at(261)).not.toEqual(rect(0)["[data-spine-shape='city']"])
    expect(at(280)).toEqual({ left: 8, top: 8, width: 60, height: 60 })
    expect(at(300)).toEqual(rect(0)["[data-spine-shape='city']"])
    expect(at(400)).toEqual(rect(0)["[data-spine-shape='city']"])
  })
  it("without a tail the hold is constant from its start", () => {
    const plain = buildTimeline([hold("hero", 200), transition("t", "hero", "city", 60), hold("city", 200)])
    expect(shapeAt(plain, 261, rect(0))).toEqual(rect(0)["[data-spine-shape='city']"])
  })
})

describe("ownerHoldAt", () => {
  const t = buildTimeline([hold("hero", 200), transition("t", "hero", "city", 60), hold("city", 200)])
  it("belongs to the hold, then to the morph's target past its middle", () => {
    expect(ownerHoldAt(t, 0)).toBe("hero")
    expect(ownerHoldAt(t, 229.9)).toBe("hero")
    expect(ownerHoldAt(t, 230)).toBe("city")
    expect(ownerHoldAt(t, 259.9)).toBe("city")
    expect(ownerHoldAt(t, 260)).toBe("city")
  })
  it("clamps outside the timeline", () => {
    expect(ownerHoldAt(t, -50)).toBe("hero")
    expect(ownerHoldAt(t, 9999)).toBe("city")
  })
})
