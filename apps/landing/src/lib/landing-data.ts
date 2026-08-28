import { useEffect, useState } from "react"
import { useDbStore, type Arch, type ArchSummary } from "@nolli/data"
import { CLUSTER_CITY, HERO_SLUG } from "./constants"
import { cityIdByName, computeStats, pickIndexPhotos } from "./shape"

export type LandingData = {
  summaries: ArchSummary[]
  cluster: ArchSummary[]
  indexPhotos: ArchSummary[]
  hero: Arch
  stats: { architectures: number; architects: number }
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
        const summaries = await dataSource.getAllArchitectures()
        const options = await dataSource.getFilterOptions()
        const cityId = cityIdByName(options, CLUSTER_CITY)
        if (!cityId) throw new Error(`cluster city "${CLUSTER_CITY}" not found`)
        const cluster = await dataSource.getAllArchitectures({ cityIds: [cityId] })
        const hero = await dataSource.getArchBySlug(HERO_SLUG)
        if (!hero) throw new Error(`hero architecture "${HERO_SLUG}" not found`)
        if (cancelled) return
        const indexPhotos = pickIndexPhotos(cluster, hero.coordinates, 10)
        setData({
          summaries,
          cluster,
          indexPhotos,
          hero,
          stats: computeStats(summaries),
        })
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
