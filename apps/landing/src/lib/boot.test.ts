import { describe, expect, it } from "vitest"
import { BOOT_PHASES, phaseAtLeast } from "./boot"

describe("phaseAtLeast", () => {
  it("orders the boot phases", () => {
    expect([...BOOT_PHASES]).toEqual([
      "blank",
      "headline",
      "map",
      "furniture",
      "reveal",
      "done",
    ])
  })

  it("is false before the floor and true from it on", () => {
    expect(phaseAtLeast("blank", "headline")).toBe(false)
    expect(phaseAtLeast("headline", "headline")).toBe(true)
    expect(phaseAtLeast("done", "headline")).toBe(true)
    expect(phaseAtLeast("map", "furniture")).toBe(false)
    expect(phaseAtLeast("reveal", "furniture")).toBe(true)
    expect(phaseAtLeast("done", "done")).toBe(true)
  })
})
