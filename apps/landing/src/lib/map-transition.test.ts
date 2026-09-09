import { describe, expect, it } from "vitest"
import { transitionMode } from "./map-transition"

describe("transitionMode", () => {
  const minSide = 1000 // 30% → 300px screen budget

  it("flies when the target is on-screen at similar zoom", () => {
    expect(transitionMode(120, minSide, 0.2)).toBe("fly")
    expect(transitionMode(0, minSide, 0)).toBe("fly")
  })

  it("snapshots when the target is far across the screen", () => {
    expect(transitionMode(301, minSide, 0)).toBe("snapshot")
  })

  it("snapshots when the zoom delta exceeds a stop-ish change", () => {
    expect(transitionMode(0, minSide, 0.76)).toBe("snapshot")
    expect(transitionMode(0, minSide, -2)).toBe("snapshot")
  })

  it("flies at the exact thresholds", () => {
    expect(transitionMode(300, minSide, 0.75)).toBe("fly")
  })
})
