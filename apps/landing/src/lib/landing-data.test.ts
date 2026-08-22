import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { landingDataSchema } from "./landing-data"

const summary = {
  id: 1,
  slug: "s",
  name: "n",
  architect: "a",
  year: 2000,
  coordinates: { lng: 2, lat: 48 },
  cover: { image: "", width: 1, height: 1 },
}

const hero = {
  ...summary,
  address: "",
  city: "Paris",
  country: "France",
  photos: [],
  notes: [],
  links: { googleMaps: "" },
}

describe("landingDataSchema", () => {
  it("parses a minimal valid payload", () => {
    const data = {
      summaries: [summary],
      cluster: [summary],
      hero,
      boardSet: [hero],
      stats: { architectures: 1, architects: 1 },
      heroCamera: { center: [2, 48] as [number, number], zoom: 15.6 },
    }
    expect(landingDataSchema.parse(data)).toBeTruthy()
  })

  it("parses the baked public/landing-data.json", () => {
    const path = join(process.cwd(), "public", "landing-data.json")
    if (!existsSync(path)) return
    const parsed = landingDataSchema.parse(JSON.parse(readFileSync(path, "utf8")))
    expect(parsed.summaries.length).toBeGreaterThan(0)
    expect(parsed.cluster.length).toBeGreaterThan(0)
    expect(parsed.hero.slug).toBe("centre-pompidou")
    expect(parsed.heroCamera.center[0]).toBeGreaterThanOrEqual(2)
    expect(parsed.heroCamera.center[0]).toBeLessThan(3)
    expect(parsed.heroCamera.center[1]).toBeGreaterThan(48)
  })
})
