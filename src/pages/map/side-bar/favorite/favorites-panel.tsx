import { useEffect, useState } from "react"
import { useDbStore } from "@/stores/db"
import { useAuthStore } from "@/stores/auth"
import { useFavoritesStore } from "@/stores/favorites"
import type { ArchSummary } from "@/lib/data/architectures.type"
import { ArchScrollList } from "../arch-summary/arch-scroll-list"
import { Body2, H5 } from "@/components/ui/typography"
import styles from "./favorites-panel.module.css"

export function FavoritesPanel() {
  const dataSource = useDbStore((s) => s.dataSource)
  const user = useAuthStore((s) => s.user)
  const ids = useFavoritesStore((s) => s.ids)
  const loading = useFavoritesStore((s) => s.loading)

  const [summaries, setSummaries] = useState<ArchSummary[]>([])
  const [loadingSummaries, setLoadingSummaries] = useState(false)

  // Re-fetch only the favorited summaries when the id set changes.
  const key = ids.join(",")
  useEffect(() => {
    if (!dataSource || ids.length === 0) {
      setSummaries([])
      return
    }
    let cancelled = false
    setLoadingSummaries(true)
    dataSource
      .getArchSummariesByIds(ids)
      .then((rows) => {
        if (cancelled) return
        // Preserve favorites order (recency), dropping any id with no row.
        const byId = new Map(rows.map((r) => [r.id, r]))
        setSummaries(ids.map((x) => byId.get(x)).filter(Boolean) as ArchSummary[])
      })
      .finally(() => {
        if (!cancelled) setLoadingSummaries(false)
      })
    return () => {
      cancelled = true
    }
  }, [dataSource, key]) // eslint-disable-line react-hooks/exhaustive-deps

  let content;
  // Guest state: prompt sign-in.
  if (!user) {
    content= (
      <Body2 className={styles.message}>
        Sign in to save and view your favorite architectures.
      </Body2>
    )
  }

  if (summaries.length === 0){
    if ((loading || loadingSummaries)) {
      content = <Body2 className={styles.message}>Loading...</Body2>
    } else {
      content = (
        <Body2 className={styles.message}>
          No favorites yet — tap the ♥ on any building to save it here.
        </Body2>
      )
    }
  } else {
    content =  <ArchScrollList archs={summaries} />
  }

  return <>
    <H5>My Favorites</H5>
    {content}
  </>
}
