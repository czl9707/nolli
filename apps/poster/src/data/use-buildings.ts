import { useEffect, useState } from "react"
import { useDbStore } from "@nolli/data"
import type { PosterBuilding } from "@/types"
import { toPosterBuilding } from "@/lib/to-poster-building"

export type BuildingsState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; buildings: PosterBuilding[] }

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
          .map(toPosterBuilding)
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
