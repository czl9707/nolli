import { describe, expect, it } from "vitest"
import { mergedQuery, parseMapParams, serializeMapParams } from "./url-state"

describe("side param", () => {
  it("parses a valid side", () => {
    expect(parseMapParams("?side=left").side).toBe("left")
    expect(parseMapParams("?side=right").side).toBe("right")
    expect(parseMapParams("?side=top").side).toBe("top")
    expect(parseMapParams("?side=bottom").side).toBe("bottom")
  })

  it("defaults to undefined when absent", () => {
    expect(parseMapParams("?center=1,2").side).toBeUndefined()
  })

  it("rejects unknown values", () => {
    expect(parseMapParams("?side=diagonal").side).toBeUndefined()
  })

  it("serializes non-default sides", () => {
    expect(
      serializeMapParams({ selection: new Set(["x"]), side: "left" })
    ).toContain("side=left")
  })

  it("omits the default (right) side", () => {
    expect(
      serializeMapParams({ selection: new Set(["x"]), side: "right" })
    ).not.toContain("side=")
  })
})

describe("mergedQuery", () => {
  // Pure core of mergeQuery — the linchpin that keeps the map hook's
  // center/zoom/selection writes from dropping the route hook's `side` (and
  // vice versa). Each call must touch only its own keys.
  it("sets a key on an empty search", () => {
    expect(mergedQuery("", { side: "left" })).toBe("?side=left")
  })

  it("preserves untouched keys", () => {
    expect(mergedQuery("?center=1&zoom=3", { side: "left" })).toBe("?center=1&zoom=3&side=left")
  })

  it("overwrites an existing key", () => {
    expect(mergedQuery("?side=right", { side: "left" })).toBe("?side=left")
  })

  it("deletes on undefined", () => {
    expect(mergedQuery("?side=right&zoom=3", { side: undefined })).toBe("?zoom=3")
  })

  it("deletes on empty string", () => {
    expect(mergedQuery("?side=right", { side: "" })).toBe("")
  })

  it("returns empty string when nothing remains", () => {
    expect(mergedQuery("?side=right", { side: undefined })).toBe("")
  })
})
