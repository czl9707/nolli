import { useCallback, useState } from "react"
import { useFilterStore } from "@/stores/filter"
import { ArchCard } from "./arch-card"
import { ArchCardSkeleton } from "./arch-card-skeleton"
import styles from "./arch-list.module.css"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Body2 } from "../ui/typography"

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
      <Body2 className={styles.emptyState}>
        Use filters above to browse architectures
      </Body2>
    )
  }

  if (filteredArchs.length === 0) {
    return (
      <Body2 className={styles.emptyState}>
        No architectures match your filters
      </Body2>
    )
  }

  const visible = filteredArchs.slice(0, renderCount)
  const hasMore = renderCount < filteredArchs.length

  return (
    <ScrollArea className={styles.scrollArea}>
      <div className={styles.content}>
        {visible.map((arch) => (
          <ArchCard key={arch.slug} arch={arch} />
        ))}
        {hasMore && <ArchCardSkeleton onLoadMore={handleLoadMore} />}
        <span />
      </div>
    </ScrollArea>
  )
}
