import { useCallback, useEffect, useRef, useState } from "react"
import type { Arch, ArchSummary } from "@nolli/data"
import { useDbStore } from "@/stores/db"

/** Max suggestions shown per axis. */
export const SUGGESTION_CAP = 3

export type RelatedAxis = {
  items: ArchSummary[]
  total: number
  shuffle: () => void
}

export type RelatedBuildings = {
  architect: RelatedAxis
  city: RelatedAxis
  loading: boolean
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffleArr<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pick `count` items from `pool`. When the pool is larger than `count` and
 * `avoid` is given, prefer items not in `avoid` so a re-roll visibly changes
 * the result. If the pool has `count` or fewer items, returns them all
 * (shuffled) — the caller hides the shuffle button in that case.
 */
export function pickRandom<T>(
  pool: readonly T[],
  count: number,
  avoid: readonly T[] = [],
): T[] {
  if (pool.length <= count) return shuffleArr(pool)
  const avoidSet = new Set(avoid)
  const unseen = shuffleArr(pool.filter((x) => !avoidSet.has(x)))
  const chosen = unseen.slice(0, count)
  if (chosen.length >= count) return chosen
  // Not enough unseen — top up from the previously-shown (avoided) set.
  const seen = shuffleArr(avoid.filter((x) => !chosen.includes(x)))
  return [...chosen, ...seen.slice(0, count - chosen.length)]
}

/**
 * Derives architect-mate and city-mate suggestion pools for the given arch.
 * Resolves names→ids via getFilterOptions, fetches pools via
 * getAllArchitectures, excludes the current building, and picks SUGGESTION_CAP
 * random per axis. Pools are cached in a ref so `shuffle` re-rolls instantly.
 * Re-derives whenever the selected slug changes.
 */
export function useRelatedBuildings(arch: Arch | null): RelatedBuildings {
  const dataSource = useDbStore((s) => s.dataSource)

  const [architectItems, setArchitectItems] = useState<ArchSummary[]>([])
  const [architectTotal, setArchitectTotal] = useState(0)
  const [cityItems, setCityItems] = useState<ArchSummary[]>([])
  const [cityTotal, setCityTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const poolsRef = useRef<{
    architect: ArchSummary[]
    city: ArchSummary[]
  } | null>(null)

  useEffect(() => {
    if (!arch || !dataSource) {
      poolsRef.current = null
      setArchitectItems([])
      setArchitectTotal(0)
      setCityItems([])
      setCityTotal(0)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      const opts = await dataSource.getFilterOptions()
      if (cancelled) return

      const architectId = opts.architects.find((a) => a.name === arch.architect)?.id
      const cityId = opts.cities.find((c) => c.name === arch.city)?.id

      const [byArch, byCity] = await Promise.all([
        architectId != null
          ? dataSource.getAllArchitectures({ architectIds: [architectId] })
          : Promise.resolve<ArchSummary[]>([]),
        cityId != null
          ? dataSource.getAllArchitectures({ cityIds: [cityId] })
          : Promise.resolve<ArchSummary[]>([]),
      ])
      if (cancelled) return

      const architectPool = byArch.filter((x) => x.slug !== arch.slug)
      const cityPool = byCity.filter((x) => x.slug !== arch.slug)

      poolsRef.current = { architect: architectPool, city: cityPool }
      setArchitectItems(pickRandom(architectPool, SUGGESTION_CAP))
      setArchitectTotal(architectPool.length)
      setCityItems(pickRandom(cityPool, SUGGESTION_CAP))
      setCityTotal(cityPool.length)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [arch?.slug, dataSource]) // eslint-disable-line react-hooks/exhaustive-deps

  const shuffleArchitect = useCallback(() => {
    const pool = poolsRef.current?.architect
    if (!pool) return
    setArchitectItems((prev) => pickRandom(pool, SUGGESTION_CAP, prev))
  }, [])

  const shuffleCity = useCallback(() => {
    const pool = poolsRef.current?.city
    if (!pool) return
    setCityItems((prev) => pickRandom(pool, SUGGESTION_CAP, prev))
  }, [])

  return {
    architect: { items: architectItems, total: architectTotal, shuffle: shuffleArchitect },
    city: { items: cityItems, total: cityTotal, shuffle: shuffleCity },
    loading,
  }
}
