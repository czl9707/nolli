import { useEffect, useState } from "react"
import type { FilterOptions } from "./data-source.type"
import { useDbStore } from "./db-store"

const EMPTY_OPTIONS: FilterOptions = {
  architects: [],
  cities: [],
  countries: [],
}

/**
 * Lazily loads `FilterOptions` (the architect/city/country lists powering the
 * filter panel) once the db `DataSource` is ready. Returns `null` until loaded,
 * and the empty triple on a db error so the panel can render an "Error"
 * placeholder. Shared by both apps' filter panels so the load + error handling
 * isn't duplicated.
 */
export function useFilterOptions(): {
  options: FilterOptions | null
  dbError: Error | null
} {
  const dataSource = useDbStore((s) => s.dataSource)
  const loading = useDbStore((s) => s.loading)
  const dbError = useDbStore((s) => s.error)
  const [options, setOptions] = useState<FilterOptions | null>(null)

  useEffect(() => {
    if (loading) return
    if (dbError != null || !dataSource) {
      setOptions(EMPTY_OPTIONS)
      return
    }
    dataSource.getFilterOptions().then(setOptions)
  }, [dataSource, loading, dbError])

  return { options, dbError }
}
