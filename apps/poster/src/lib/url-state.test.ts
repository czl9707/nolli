import { describe, expect, it } from "vitest"
import { parseMapParams, serializeMapParams } from "./url-state"

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
