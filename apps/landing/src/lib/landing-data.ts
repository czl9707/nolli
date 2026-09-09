import { useEffect, useState } from "react"
import { useDbStore, type ArchSummary, type DataSource, type FilterOptions } from "@nolli/data"
import { ARCHITECT_LEDGER, CITY_DECK, CITY_LEDGER, STATS_DECK_SLUGS } from "./constants"

export type ArchEntry = {
  id: number
  name: string
  works: ArchSummary[]
}

export type HeroCity = {
  name: string
  country: string
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
  /** The hero's random city + its deck of archs */
  heroCity: HeroCity
  heroArchs: ArchSummary[]
  /** Architect ledger: curated names matched to the DB, each with its works */
  architectLedger: ArchEntry[]
  /** City ledger: decked archs per curated city, keyed by city name */
  cityLedger: Record<string, ArchSummary[]>
  /** Collection counts + photo deck for the stats scene — live from the DB */
  stats: CollectionStats
}

/** Ledger for the architect scene — curated names in order, falling back to
 * the first DB architects when none match; entries need MIN_WORKS to show. */
const MIN_WORKS = 2
const MAX_ARCHS = 8

/** Resolve a deck's slugs to arch summaries, in deck order — the slug query
 * returns rows in unspecified order, so reorder against the input. */
async function deckArchs(dataSource: DataSource, slugs: readonly string[]): Promise<ArchSummary[]> {
  const rows = await dataSource.getArchSummariesBySlugs([...slugs])
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  return slugs.flatMap((s) => {
    const hit = bySlug.get(s)
    return hit ? [hit] : []
  })
}

async function loadArchitectLedger(dataSource: DataSource, options: FilterOptions): Promise<ArchEntry[]> {
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

function pickHeroCity(options: FilterOptions): HeroCity {
  const name = CITY_LEDGER[Math.floor(Math.random() * CITY_LEDGER.length)]
  const countryByCode = new Map(options.countries.map((c) => [c.code, c.name]))
  const code = options.cities.find((c) => c.name === name)?.countryCode
  return { name, country: (code && countryByCode.get(code)) || "" }
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
        const heroCity = pickHeroCity(options)
        const heroArchs = await deckArchs(dataSource, CITY_DECK[heroCity.name])
        if (!heroArchs.length) throw new Error(`hero city "${heroCity.name}" deck is empty`)
        const [architectLedger, deckEntries] = await Promise.all([
          loadArchitectLedger(dataSource, options),
          Promise.all(
            Object.entries(CITY_DECK).map(async ([name, slugs]) => [name, await deckArchs(dataSource, slugs)] as const),
          ),
        ])
        // cities whose whole deck fails to resolve stay dim in the grid
        const cityLedger = Object.fromEntries(deckEntries.filter(([, archs]) => archs.length > 0))
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
        setData({ heroCity, heroArchs, architectLedger, cityLedger, stats })
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
