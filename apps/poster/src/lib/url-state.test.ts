import { describe, it, expect } from "vitest"
import { parseMapParams, serializeMapParams } from "./url-state"

describe("parseMapParams", () => {
  it("parses a complete valid query", () => {
    const r = parseMapParams("?center=2.3364,48.8605&zoom=14.52&selection=a,b")
    expect(r.center).toEqual([2.3364, 48.8605])
    expect(r.zoom).toBe(14.52)
    expect(r.selection).toEqual(new Set(["a", "b"]))
  })

  it("returns undefined center/zoom and empty set when no params", () => {
    const r = parseMapParams("")
    expect(r.center).toBeUndefined()
    expect(r.zoom).toBeUndefined()
    expect(r.selection).toEqual(new Set())
  })

  it("drops a malformed center but keeps the rest", () => {
    const r = parseMapParams("?center=foo,bar&zoom=10&selection=x")
    expect(r.center).toBeUndefined()
    expect(r.zoom).toBe(10)
    expect(r.selection).toEqual(new Set(["x"]))
  })

  it("drops center with only one coordinate", () => {
    const r = parseMapParams("?center=2.33")
    expect(r.center).toBeUndefined()
  })

  it("drops a non-finite zoom", () => {
    const r = parseMapParams("?zoom=abc")
    expect(r.zoom).toBeUndefined()
  })

  it("ignores empty selection entries", () => {
    const r = parseMapParams("?selection=,,a,,")
    expect(r.selection).toEqual(new Set(["a"]))
  })

  it("drops out-of-range center coordinates", () => {
    expect(parseMapParams("?center=999,999").center).toBeUndefined()
    expect(parseMapParams("?center=2.33,91").center).toBeUndefined()
    expect(parseMapParams("?center=2.33,48.86").center).toEqual([2.33, 48.86])
  })
})

describe("serializeMapParams", () => {
  it("serializes a full state", () => {
    const q = serializeMapParams({
      center: [2.336419, 48.860512],
      zoom: 14.5239,
      selection: new Set(["a", "b"]),
    })
    expect(q).toBe("center=2.33642,48.86051&zoom=14.52&selection=a,b")
  })

  it("omits selection when empty", () => {
    const q = serializeMapParams({
      center: [2.3364, 48.8605],
      zoom: 14.5,
      selection: new Set(),
    })
    expect(q).toBe("center=2.3364,48.8605&zoom=14.5")
  })

  it("returns empty string when nothing is set", () => {
    expect(serializeMapParams({ selection: new Set() })).toBe("")
  })
})
