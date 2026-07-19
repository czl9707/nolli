import { describe, it, expect } from "vitest"
import { decideFocus } from "./focus-decision"

const baseInput = {
  mapReady: true,
  valid: true,
  sameAsLastFlown: false,
  hasFlown: false,
}

describe("decideFocus", () => {
  it("returns 'none' when the map is not ready", () => {
    expect(decideFocus({ ...baseInput, mapReady: false })).toBe("none")
  })

  it("returns 'none' when coords are invalid", () => {
    expect(decideFocus({ ...baseInput, valid: false })).toBe("none")
  })

  it("returns 'none' when the target equals the last flown coord", () => {
    expect(decideFocus({ ...baseInput, sameAsLastFlown: true })).toBe("none")
  })

  it("returns 'now' for the first qualifying fly (hasFlown false)", () => {
    expect(decideFocus({ ...baseInput, hasFlown: false })).toBe("now")
  })

  it("returns 'debounce' for subsequent qualifying flies (hasFlown true)", () => {
    expect(decideFocus({ ...baseInput, hasFlown: true })).toBe("debounce")
  })

  it("prioritizes mapReady over validity", () => {
    expect(decideFocus({ ...baseInput, mapReady: false, valid: false })).toBe("none")
  })

  it("suppresses a re-fly to the last flown target even before first fly would normally be 'now'", () => {
    expect(
      decideFocus({ ...baseInput, sameAsLastFlown: true, hasFlown: false }),
    ).toBe("none")
  })
})
