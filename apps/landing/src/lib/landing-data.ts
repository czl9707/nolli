import { useEffect, useState } from "react"
import { useDbStore, type ArchSummary, type DataSource } from "@nolli/data"
import { ARCH_ROSTER, CLUSTER_CITY, HERO_SLUG } from "./constants"
import { cityIdByName, pickIndexPhotos } from "./shape"

export type ArchEntry = {
  id: number
  name: string
  works: ArchSummary[]
}

export type LandingData = {
  /** Paris picks the hero reveal shows — the index reuses them as its Paris set */
  heroPicks: ArchSummary[]
  /** Architect-scene roster: curated names matched to the DB, each with its works */
  archRoster: ArchEntry[]
}

/** Roster for the architect scene — curated names in order, falling back to
 * the first DB architects when none match; entries need MIN_WORKS to show. */
const MIN_WORKS = 2
const MAX_ARCHS = 8

async function loadArchRoster(dataSource: DataSource): Promise<ArchEntry[]> {
  const options = await dataSource.getFilterOptions()
  const byName = new Map(options.architects.map((a) => [a.name.toLowerCase(), a.id]))
  const picks: { id: number; name: string }[] = []
  for (const name of ARCH_ROSTER) {
    const id = byName.get(name.toLowerCase())
    if (id) picks.push({ id, name })
  }
  const roster = picks.length ? picks : options.architects.slice(0, MAX_ARCHS).map((a) => ({ id: a.id, name: a.name }))
  const loaded = await Promise.all(
    roster.map(async (a) => ({
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
        const archRoster = await loadArchRoster(dataSource)
        if (cancelled) return
        setData({ heroPicks: pickIndexPhotos(cluster, hero.coordinates, 10), archRoster })
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
