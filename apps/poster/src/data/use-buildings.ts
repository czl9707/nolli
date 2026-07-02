import { useEffect, useState } from "react"
import { useDbStore } from "@nolli/data"
import type { ArchSummary } from "@nolli/data"
import type { PosterBuilding } from "@/types"

export type BuildingsState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; buildings: PosterBuilding[] }

/**
 * Loads every architecture once the shared db store has a ready DataSource,
 * then maps to PosterBuilding[] — dropping any without a usable cover photo
 * (no image / unknown dimensions), matching the old build-snapshot behaviour.
 */
function toPoster(a: ArchSummary): PosterBuilding | null {
  const { image, width, height } = a.cover
  if (!image || !width || !height) return null
  return { ...a, cover: { image, width, height } }
}

export function useBuildings(): BuildingsState {
  const dataSource = useDbStore((s) => s.dataSource)
  const dbError = useDbStore((s) => s.error)
  const [state, setState] = useState<BuildingsState>({ status: "loading" })

  useEffect(() => {
    if (dbError) {
      setState({ status: "error", error: dbError })
      return
    }
    if (!dataSource) return

    let cancelled = false
    dataSource
      .getAllArchitectures()
      .then((archs) => {
        if (cancelled) return
        const buildings = archs
          .map(toPoster)
          .filter((b): b is PosterBuilding => b !== null)
        setState({ status: "ready", buildings })
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", error })
      })
    return () => {
      cancelled = true
    }
  }, [dataSource, dbError])

  return state
}
