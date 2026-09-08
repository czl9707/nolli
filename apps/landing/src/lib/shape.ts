import type { ArchSummary, FilterOptions } from "@nolli/data"

export function cityIdByName(options: FilterOptions, name: string): number | null {
  const hit = options.cities.find((c) => c.name.toLowerCase() === name.toLowerCase())
  return hit ? hit.id : null
}

export function nearestPhotos(
  cluster: ArchSummary[],
  seed: ArchSummary["coordinates"],
  count = 5,
): ArchSummary[] {
  const d2 = (c: ArchSummary["coordinates"]) =>
    (c.lng - seed.lng) ** 2 + (c.lat - seed.lat) ** 2
  const pool = [...cluster].sort((a, b) => d2(a.coordinates) - d2(b.coordinates))
  const chosen = [pool.shift()!]
  while (chosen.length < count && pool.length) {
    let best = 0
    let bestDist = -1
    pool.forEach((cand, i) => {
      const nearest = Math.min(
        ...chosen.map((p) =>
          (p.coordinates.lng - cand.coordinates.lng) ** 2 +
          (p.coordinates.lat - cand.coordinates.lat) ** 2,
        ),
      )
      if (nearest > bestDist) {
        bestDist = nearest
        best = i
      }
    })
    chosen.push(pool.splice(best, 1)[0])
  }
  return chosen
}
