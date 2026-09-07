import { describe, expect, it } from "vitest"
import { cityIdByName, nearestPhotos } from "./shape"
import type { ArchSummary } from "@nolli/data"

const s = (id: number, over: Partial<ArchSummary> = {}): ArchSummary => ({
  id,
  slug: `s${id}`,
  name: `n${id}`,
  architect: "a",
  year: 2000,
  coordinates: { lng: id * 0.001, lat: 48.86 },
  cover: { image: "", width: 1, height: 1 },
  ...over,
})

describe("cityIdByName", () => {
  it("finds city id case-insensitively, null when absent", () => {
    const options = { architects: [], cities: [{ id: 7, name: "Paris", countryCode: "FR" }], countries: [] }
    expect(cityIdByName(options, "paris")).toBe(7)
    expect(cityIdByName(options, "Tokyo")).toBeNull()
  })
})

describe("nearestPhotos", () => {
  it("spreads archs across the cluster (farthest-point)", () => {
    const cluster = [1, 2, 3, 4, 5, 6].map((i) => s(i, { coordinates: { lng: i * 10, lat: 48 } }))
    const archs = nearestPhotos(cluster, cluster[0].coordinates, 3)
    expect(archs).toHaveLength(3)
    expect(archs[0].id).toBe(1) // seeded by nearest-to-hero
    expect(new Set(archs.map((p) => p.id)).size).toBe(3)
  })
})
