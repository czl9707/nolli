import { useCallback, useState } from "react"
import { useFilterStore } from "@/stores/filter"
import { ArchCard } from "./arch-card"
import { ArchCardSkeleton } from "./arch-card-skeleton"
import styles from "./arch-list.module.css"

const PAGE_SIZE = 20

export function ArchList() {
  const filteredArchs = useFilterStore((s) => s.filteredArchs)
  const architectIds = useFilterStore((s) => s.architectIds)
  const cityIds = useFilterStore((s) => s.cityIds)
  const hasFilters = architectIds.length > 0 || cityIds.length > 0

  const [renderCount, setRenderCount] = useState(PAGE_SIZE)

  const handleLoadMore = useCallback(() => {
    setRenderCount((prev) => prev + PAGE_SIZE)
  }, [])

  if (!hasFilters) {
    return (
      <span className={styles.emptyState}>
        Use filters above to browse architectures
      </span>
    )
  }

  if (filteredArchs.length === 0) {
    return (
      <span className={styles.emptyState}>
        No architectures match your filters
      </span>
    )
  }

  const visible = filteredArchs.slice(0, renderCount)
  const hasMore = renderCount < filteredArchs.length

  return (
    <div className={styles.list}>
      {visible.map((arch) => (
        <ArchCard key={arch.slug} arch={arch} />
      ))}
      {hasMore && <ArchCardSkeleton onLoadMore={handleLoadMore} />}
    </div>
  )
}
