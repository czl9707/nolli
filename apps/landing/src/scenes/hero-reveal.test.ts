import { describe, expect, it } from "vitest"
import { pruneTrail, trailHit, type TrailPoint } from "./hero-reveal"

const TTL = 800

const pt = (x: number, y: number, age: number): TrailPoint => ({ x, y, t: 1000 - age })

describe("pruneTrail", () => {
  it("keeps points inside the window, drops expired ones", () => {
    const pts = [pt(0, 0, TTL), pt(10, 0, TTL - 1), pt(20, 0, TTL + 1)]
    expect(pruneTrail(pts, 1000, TTL)).toEqual([pt(0, 0, TTL), pt(10, 0, TTL - 1)])
  })

  it("keeps everything while young", () => {
    const pts = [pt(0, 0, 0), pt(1, 1, 100)]
    expect(pruneTrail(pts, 1000, TTL)).toBe(pts)
  })
})

describe("trailHit", () => {
  it("hits within the radius of a live point", () => {
    const pts = [pt(100, 100, 0)]
    expect(trailHit(pts, 220, 100, 120, 1000, TTL)).toBe(true)
    expect(trailHit(pts, 221, 100, 120, 1000, TTL)).toBe(false)
  })

  it("misses expired points even at zero distance", () => {
    const pts = [pt(100, 100, TTL + 1)]
    expect(trailHit(pts, 100, 100, 120, 1000, TTL)).toBe(false)
  })

  it("hits when any point in the history covers the target", () => {
    const pts = [pt(0, 0, TTL + 1), pt(50, 50, 100), pt(300, 300, 0)]
    expect(trailHit(pts, 60, 60, 120, 1000, TTL)).toBe(true)
  })
})
