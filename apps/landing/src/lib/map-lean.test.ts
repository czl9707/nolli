// The map-lean probe. The parallax math from map-lean.ts plus the css
// contract: the spine's map wrapper consumes the two custom properties
// and its overscan covers the full lean, so the edge can never show.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  easeToward,
  MAP_LEAN_OVERSCAN,
  parallaxOffset,
  PARALLAX_RATE,
  PARALLAX_SHIFT_X,
  PARALLAX_SHIFT_Y,
  pointerNorm,
  settled,
} from "./map-lean"

describe("map pointer lean", () => {
  it("normalizes the cursor to ±1 from the viewport center", () => {
    expect(pointerNorm(0, 0, 1440, 900)).toEqual({ x: -1, y: -1 })
    expect(pointerNorm(1440, 900, 1440, 900)).toEqual({ x: 1, y: 1 })
    expect(pointerNorm(720, 450, 1440, 900)).toEqual({ x: 0, y: 0 })
    expect(pointerNorm(360, 225, 1440, 900)).toEqual({ x: -0.5, y: -0.5 })
  })

  it("the map leans opposite the cursor", () => {
    // cursor hard left → map right; cursor hard up → map down
    expect(parallaxOffset({ x: -1, y: 0 }).x).toBe(PARALLAX_SHIFT_X)
    expect(parallaxOffset({ x: 0, y: -1 }).y).toBe(PARALLAX_SHIFT_Y)
    expect(parallaxOffset({ x: 1, y: 1 })).toEqual({ x: -PARALLAX_SHIFT_X, y: -PARALLAX_SHIFT_Y })
    // centered cursor → the map rests (the math's −0 is still zero)
    const rest = parallaxOffset({ x: 0, y: 0 })
    expect(Math.abs(rest.x) + Math.abs(rest.y)).toBe(0)
  })

  it("eases exponentially — a heavy sheet, then settled", () => {
    const target = { x: PARALLAX_SHIFT_X, y: PARALLAX_SHIFT_Y }
    // the first step is a lean, not a jump
    const step = easeToward({ x: 0, y: 0 }, target, 1 / 60)
    expect(step.x).toBeGreaterThan(0)
    expect(step.x).toBeLessThan(PARALLAX_SHIFT_X * 0.2)
    // exponential approach converges below the rest threshold
    let cur = { x: 0, y: 0 }
    for (let i = 0; i < 300; i++) cur = easeToward(cur, target, 1 / 60)
    expect(settled(cur, target)).toBe(true)
    // and the same going home
    let back = { x: target.x, y: target.y }
    for (let i = 0; i < 300; i++) back = easeToward(back, { x: 0, y: 0 }, 1 / 60)
    expect(settled(back, { x: 0, y: 0 })).toBe(true)
  })

  it("the map wrapper's overscan covers the lean — the edge can never show", () => {
    expect(MAP_LEAN_OVERSCAN).toBeGreaterThanOrEqual(PARALLAX_SHIFT_X)
    expect(MAP_LEAN_OVERSCAN).toBeGreaterThanOrEqual(PARALLAX_SHIFT_Y)
  })

  it("the lean stays a lean — a few px, never a pan", () => {
    expect(PARALLAX_SHIFT_X).toBeLessThanOrEqual(20)
    expect(PARALLAX_SHIFT_Y).toBeLessThanOrEqual(16)
    expect(PARALLAX_RATE).toBeGreaterThan(0)
  })

  it("the css contract: the spine's map wrapper takes the full lean", () => {
    const spine = readFileSync(
      fileURLToPath(new URL("../spine/spine.tsx", import.meta.url)),
      "utf8",
    )
    expect(spine).toContain("var(--map-lean-x)")
    expect(spine).toContain("var(--map-lean-y)")
    expect(spine).toContain("MAP_LEAN_OVERSCAN")
  })
})
