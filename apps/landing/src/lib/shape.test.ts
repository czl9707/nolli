import { describe, expect, it } from "vitest"
import { boardCtaLabel, cityIdByName, computeStats, pickIndexPhotos } from "./shape"
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

describe("computeStats", () => {
  it("counts architectures and distinct architects", () => {
    expect(computeStats([s(1, { architect: "x" }), s(2, { architect: "x" }), s(3)])).toEqual({
      architectures: 3,
      architects: 2,
    })
  })
})

describe("cityIdByName", () => {
  it("finds city id case-insensitively, null when absent", () => {
    const options = { architects: [], cities: [{ id: 7, name: "Paris", countryCode: "FR" }], countries: [] }
    expect(cityIdByName(options, "paris")).toBe(7)
    expect(cityIdByName(options, "Tokyo")).toBeNull()
  })
})

describe("boardCtaLabel", () => {
  const arch = { architect: "Renzo Piano", city: "Paris" }
  it("architect with 2+ works → architect CTA", () => {
    expect(boardCtaLabel([s(1, { architect: "Renzo Piano" }), s(2, { architect: "Renzo Piano" })], arch)).toBe("more by Renzo Piano →")
  })
  it("otherwise city CTA", () => {
    expect(boardCtaLabel([s(1, { architect: "Renzo Piano" })], arch)).toBe("more in Paris →")
  })
})

describe("pickIndexPhotos", () => {
  it("spreads picks across the cluster (farthest-point)", () => {
    const cluster = [1, 2, 3, 4, 5, 6].map((i) => s(i, { coordinates: { lng: i * 10, lat: 48 } }))
    const picks = pickIndexPhotos(cluster, cluster[0].coordinates, 3)
    expect(picks).toHaveLength(3)
    expect(picks[0].id).toBe(1) // seeded by nearest-to-hero
    expect(new Set(picks.map((p) => p.id)).size).toBe(3)
  })
})
