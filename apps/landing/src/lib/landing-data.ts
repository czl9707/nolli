import { useEffect, useState } from "react"
import { useDbStore, type ArchSummary, type DataSource } from "@nolli/data"
import { ARCHITECT_LEDGER, CLUSTER_CITY, HERO_SLUG, STATS_DECK_SLUGS } from "./constants"
import { cityIdByName, nearestPhotos } from "./shape"

export type ArchEntry = {
  id: number
  name: string
  works: ArchSummary[]
}

export type CollectionStats = {
  buildings: number
  architects: number
  countries: number
  /** Architecture count per ISO-2 country code — powers the where-you-are card */
  countryArchCounts: Record<string, number>
  /** Curated photo deck for the scene (STATS_DECK_SLUGS) */
  worldArchs: ArchSummary[]
}

export type LandingData = {
  /** Paris archs the hero reveal shows */
  heroArchs: ArchSummary[]
  /** Architect ledger: curated names matched to the DB, each with its works */
  architectLedger: ArchEntry[]
  /** Collection counts + photo deck for the stats scene — live from the DB */
  stats: CollectionStats
}

/** Ledger for the architect scene — curated names in order, falling back to
 * the first DB architects when none match; entries need MIN_WORKS to show. */
const MIN_WORKS = 2
const MAX_ARCHS = 8

async function loadArchitectLedger(dataSource: DataSource): Promise<ArchEntry[]> {
  const options = await dataSource.getFilterOptions()
  const byName = new Map(options.architects.map((a) => [a.name.toLowerCase(), a.id]))
  const matched: { id: number; name: string }[] = []
  for (const name of ARCHITECT_LEDGER) {
    const id = byName.get(name.toLowerCase())
    if (id) matched.push({ id, name })
  }
  const entries = matched.length ? matched : options.architects.slice(0, MAX_ARCHS).map((a) => ({ id: a.id, name: a.name }))
  const loaded = await Promise.all(
    entries.map(async (a) => ({
      ...a,
      works: await dataSource.getAllArchitectures({ architectIds: [a.id] }),
    })),
  )
  return loaded.filter((e) => e.works.length >= MIN_WORKS).slice(0, MAX_ARCHS)
}

export function useLandingData() {
  const dataSource = useDbStore((s) => s.dataSource)
  const error = useDbStore((s) => s.error)
  const [data, setData] = useState<LandingData | null>(null)
  const [err, setErr] = useState<Error | null>(null)

  useEffect(() => {
    if (!dataSource) return
    let cancelled = false
    ;(async () => {
      try {
        const options = await dataSource.getFilterOptions()
        const cityId = cityIdByName(options, CLUSTER_CITY)
        if (!cityId) throw new Error(`cluster city "${CLUSTER_CITY}" not found`)
        const cluster = await dataSource.getAllArchitectures({ cityIds: [cityId] })
        const hero = await dataSource.getArchBySlug(HERO_SLUG)
        if (!hero) throw new Error(`hero architecture "${HERO_SLUG}" not found`)
        const architectLedger = await loadArchitectLedger(dataSource)
        const all = await dataSource.getAllArchitectures()
        // cities/countries tables are get-or-created per building in the
        // seed, so distinct city country codes = countries with buildings
        const stats: CollectionStats = {
          buildings: all.length,
          architects: options.architects.length,
          countries: new Set(options.cities.map((c) => c.countryCode)).size,
          countryArchCounts: Object.fromEntries(
            (await dataSource.getCountryArchCounts()).map((c) => [c.code, c.count]),
          ),
          worldArchs: await dataSource.getArchSummariesBySlugs(STATS_DECK_SLUGS),
        }
        if (cancelled) return
        setData({ heroArchs: nearestPhotos(cluster, hero.coordinates, 10), architectLedger, stats })
      } catch (e) {
        if (!cancelled) setErr(e as Error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dataSource])

  if (err) return { status: "error" as const, error: err }
  if (error) return { status: "error" as const, error }
  if (data) return { status: "ready" as const, data }
  return { status: "loading" as const }
}
