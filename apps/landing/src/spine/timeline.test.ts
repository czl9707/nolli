// src/spine/timeline.test.ts
import { describe, expect, it } from "vitest"
import { buildTimeline, shapeAt, type SpineScene } from "./timeline"

const hold = (id: string, shape: string, heightVh = 100): SpineScene => ({
  kind: "hold", id, shape, heightVh, Component: () => null,
})
const trans = (id: string, from: string, to: string, heightVh = 120): SpineScene => ({
  kind: "transition", id, fromShape: from, toShape: to, heightVh,
})

const RECTS = {
  hero: { left: 0, top: 0, width: 1440, height: 900 },
  index: { left: 621, top: 56, width: 759, height: 664 },
}

const tl = () => buildTimeline([hold("hero", "hero", 180), trans("t", "hero", "index"), hold("index", "index", 200)])

describe("buildTimeline", () => {
  it("lays out consecutive ranges and totals", () => {
    const t = tl()
    expect(t.totalVh).toBe(500)
    expect(t.segments.map((s) => [s.scene.id, s.startVh, s.heightVh])).toEqual([
      ["hero", 0, 180], ["t", 180, 120], ["index", 300, 200],
    ])
  })
  it("throws when a transition's fromShape does not match the previous scene", () => {
    expect(() => buildTimeline([hold("a", "x"), trans("t", "y", "z")])).toThrow(/fromShape/)
  })
  it("throws when a transition's toShape does not match the next scene", () => {
    expect(() => buildTimeline([trans("t", "x", "z"), hold("a", "x")])).toThrow(/toShape/)
  })
  it("throws when adjacent holds have different shapes and no transition between", () => {
    expect(() => buildTimeline([hold("a", "x"), hold("b", "y")])).toThrow(/transition/)
  })
  it("allows adjacent holds with the same shape", () => {
    expect(() => buildTimeline([hold("a", "x"), hold("b", "x")])).not.toThrow()
  })
  it("throws on leading or trailing transitions", () => {
    expect(() => buildTimeline([trans("t", "x", "y"), hold("a", "y")])).toThrow(/fromShape/)
    expect(() => buildTimeline([hold("a", "x"), trans("t", "x", "y")])).toThrow(/toShape/)
  })
})

describe("shapeAt", () => {
  it("holds the scene rect for the whole hold segment", () => {
    const t = tl()
    expect(shapeAt(t, 0, RECTS)).toEqual(RECTS.hero)
    expect(shapeAt(t, 179.9, RECTS)).toEqual(RECTS.hero)
    expect(shapeAt(t, 300, RECTS)).toEqual(RECTS.index)
    expect(shapeAt(t, 800, RECTS)).toEqual(RECTS.index)
  })
  it("lerps linearly across a transition", () => {
    const t = tl()
    const mid = shapeAt(t, 180 + 60, RECTS) // t = 0.5
    expect(mid.left).toBeCloseTo((0 + 621) / 2)
    expect(mid.top).toBeCloseTo((0 + 56) / 2)
    expect(mid.width).toBeCloseTo((1440 + 759) / 2)
    expect(mid.height).toBeCloseTo((900 + 664) / 2)
    const q = shapeAt(t, 180 + 30, RECTS) // t = 0.25
    expect(q.left).toBeCloseTo(621 * 0.25)
  })
  it("clamps outside the timeline", () => {
    const t = tl()
    expect(shapeAt(t, -50, RECTS)).toEqual(RECTS.hero)
    expect(shapeAt(t, 9999, RECTS)).toEqual(RECTS.index)
  })
})
