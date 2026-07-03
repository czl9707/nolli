import { describe, expect, it } from "vitest"
import { mergedQuery, parseMapParams, serializeMapParams } from "./url-state"

describe("side param", () => {
  it("parses a valid corner side", () => {
    expect(parseMapParams("?side=top-left").side).toBe("top-left")
    expect(parseMapParams("?side=top-right").side).toBe("top-right")
    expect(parseMapParams("?side=bottom-left").side).toBe("bottom-left")
    expect(parseMapParams("?side=bottom-right").side).toBe("bottom-right")
  })

  it("defaults to undefined when absent", () => {
    expect(parseMapParams("?center=1,2").side).toBeUndefined()
  })

  it("rejects unknown values (incl. legacy edge names)", () => {
    expect(parseMapParams("?side=right").side).toBeUndefined()
    expect(parseMapParams("?side=diagonal").side).toBeUndefined()
  })

  it("serializes non-default sides", () => {
    expect(
      serializeMapParams({ selection: new Set(["x"]), side: "bottom-left" })
    ).toContain("side=bottom-left")
  })

  it("omits the default (top-right) side", () => {
    expect(
      serializeMapParams({ selection: new Set(["x"]), side: "top-right" })
    ).not.toContain("side=")
  })
})

describe("mergedQuery", () => {
  // Pure core of mergeQuery — the linchpin that keeps the map hook's
  // center/zoom/selection writes from dropping the route hook's `side` (and
  // vice versa). Each call must touch only its own keys.
  it("sets a key on an empty search", () => {
    expect(mergedQuery("", { side: "bottom-left" })).toBe("?side=bottom-left")
  })

  it("preserves untouched keys", () => {
    expect(mergedQuery("?center=1&zoom=3", { side: "bottom-left" })).toBe(
      "?center=1&zoom=3&side=bottom-left"
    )
  })

  it("overwrites an existing key", () => {
    expect(mergedQuery("?side=top-right", { side: "bottom-left" })).toBe(
      "?side=bottom-left"
    )
  })

  it("deletes on undefined", () => {
    expect(mergedQuery("?side=top-right&zoom=3", { side: undefined })).toBe("?zoom=3")
  })

  it("deletes on empty string", () => {
    expect(mergedQuery("?side=top-right", { side: "" })).toBe("")
  })

  it("returns empty string when nothing remains", () => {
    expect(mergedQuery("?side=top-right", { side: undefined })).toBe("")
  })
})
