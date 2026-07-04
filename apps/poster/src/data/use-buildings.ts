import { useEffect, useState } from "react"
import { useDbStore } from "@nolli/data"
import type { ArchSummary } from "@nolli/data"

export type BuildingsState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; buildings: ArchSummary[] }

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
        setState({ status: "ready", buildings: archs })
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
