import { useEffect, useState } from "react"
import { useDbStore, type Arch, type ArchSummary } from "@nolli/data"
import type { SceneCamera } from "@nolli/map"
import { BOARD_SLUGS, CLUSTER_CITY, HERO_SLUG, SITE_ZOOM } from "./constants"
import { fitCamera } from "./camera"
import { indexSlot } from "./slots"
import { cityIdByName, computeStats, pickIndexPhotos } from "./shape"

export type LandingData = {
  summaries: ArchSummary[]
  cluster: ArchSummary[]
  indexPhotos: ArchSummary[]
  hero: Arch
  boardSet: Arch[]
  stats: { architectures: number; architects: number }
  heroCamera: SceneCamera
  indexCamera: SceneCamera
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
        const boardSet = await Promise.all(BOARD_SLUGS.map((s) => dataSource.getArchBySlug(s)))
        if (boardSet.some((a) => !a)) throw new Error("board slug missing")
        if (cancelled) return
        const indexPhotos = pickIndexPhotos(cluster, hero.coordinates)
        setData({
          summaries,
          cluster,
          indexPhotos,
          hero,
          boardSet: boardSet as Arch[],
          stats: computeStats(summaries),
          heroCamera: { center: [hero.coordinates.lng, hero.coordinates.lat], zoom: SITE_ZOOM },
          // fit the picks into the plate the map settles into at index dwell
          // (indexSlot fractions of the viewport, measured at load time)
          indexCamera: fitCamera(
            indexPhotos.map((p) => p.coordinates),
            {
              width: window.innerWidth * indexSlot(window.innerWidth).w,
              height: window.innerHeight * indexSlot(window.innerWidth).h,
            },
          ),
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
