import { useCallback, useEffect, useRef, useState } from "react"
import { useFilterStore } from "@/stores/filter"
import { ArchCard } from "./arch-card"
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
  const sentinelRef = useRef<HTMLDivElement>(null)

  const hasMore = renderCount < filteredArchs.length

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRenderCount((prev) => prev + PAGE_SIZE)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

  if (!hasFilters) {
    return (
      <Body2 className={styles.emptyState}>
        No filters applied.
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

  return (
    <ScrollArea className={styles.scrollArea}>
      <div className={styles.content}>
        {visible.map((arch) => (
          <ArchCard key={arch.slug} arch={arch} />
        ))}
        {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
      </div>
    </ScrollArea>
  )
}
