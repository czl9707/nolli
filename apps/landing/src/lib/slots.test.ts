import { describe, expect, it } from "vitest"
import { indexPlate } from "./slots"

describe("indexPlate", () => {
  // no window in tests — the CSS-var fallbacks (32 pad) apply
  it("frames the plate right of the column, clear of the header", () => {
    const { rect, px, column } = indexPlate(1200, 900)
    expect(rect.x).toBeCloseTo(column.left + column.width + 32 / 1200, 10)
    expect(rect.y).toBeCloseTo((72 + 32) / 900, 10)
    // page margin on every side of the plate
    expect(rect.x + rect.w).toBeCloseTo(1 - 32 / 1200, 10)
    expect(rect.y + rect.h).toBeCloseTo(1 - 32 / 900, 10)
    expect(px.width).toBeCloseTo(rect.w * 1200, 10)
    expect(px.height).toBeCloseTo(rect.h * 900, 10)
    // under the cap the assembly fills the viewport — no side margin
    expect(column.left).toBe(0)
  })
  it("caps and centers the assembly on wide viewports", () => {
    const { rect, px, column } = indexPlate(2560, 1440)
    const assembly = 1400
    expect(column.left).toBeCloseTo((2560 - assembly) / 2 / 2560, 10)
    expect(column.width * 2560).toBeCloseTo(0.26 * assembly, 10)
    expect(px.width).toBeCloseTo(rect.w * 2560, 10)
    // plate right edge sits a component-pad inside the assembly's right edge
    expect((rect.x + rect.w) * 2560).toBeCloseTo((2560 + assembly) / 2 - 32, 10)
  })
})
