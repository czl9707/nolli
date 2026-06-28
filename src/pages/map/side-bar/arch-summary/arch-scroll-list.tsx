import { useEffect, useRef, useState } from "react"
import type { ArchSummary } from "@/lib/data/architectures.type"
import { ArchCard } from "./arch-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import styles from "./arch-scroll-list.module.css"

const PAGE_SIZE = 20

/**
 * Paginated column of ArchCards — renders PAGE_SIZE rows at a time and grows as
 * the trailing sentinel scrolls into view. Pure presentation: it takes the
 * resolved arch list and renders it, with no knowledge of how that list was
 * produced. `renderCount` only ever grows, so changing the underlying list
 * mid-scroll never yanks the user back to the top.
 */
export function ArchScrollList({ archs }: { archs: ArchSummary[] }) {
  const [renderCount, setRenderCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const hasMore = renderCount < archs.length

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

  const visible = archs.slice(0, renderCount)

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
