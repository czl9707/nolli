import type { ArchSummary, FilterOptions } from "@nolli/data"

export function computeStats(summaries: ArchSummary[]) {
  return {
    architectures: summaries.length,
    architects: new Set(summaries.map((s) => s.architect)).size,
  }
}

export function cityIdByName(options: FilterOptions, name: string): number | null {
  const hit = options.cities.find((c) => c.name.toLowerCase() === name.toLowerCase())
  return hit ? hit.id : null
}

export function pickIndexPhotos(
  cluster: ArchSummary[],
  seed: ArchSummary["coordinates"],
  count = 5,
): ArchSummary[] {
  const d2 = (c: ArchSummary["coordinates"]) =>
    (c.lng - seed.lng) ** 2 + (c.lat - seed.lat) ** 2
  const pool = [...cluster].sort((a, b) => d2(a.coordinates) - d2(b.coordinates))
  const picked = [pool.shift()!]
  while (picked.length < count && pool.length) {
    let best = 0
    let bestDist = -1
    pool.forEach((cand, i) => {
      const nearest = Math.min(
        ...picked.map((p) =>
          (p.coordinates.lng - cand.coordinates.lng) ** 2 +
          (p.coordinates.lat - cand.coordinates.lat) ** 2,
        ),
      )
      if (nearest > bestDist) {
        bestDist = nearest
        best = i
      }
    })
    picked.push(pool.splice(best, 1)[0])
  }
  return picked
}
