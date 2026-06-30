import { useEffect, useRef, useState } from "react"
import type { ArchSummary } from "@/lib/data/architectures.type"
import type { NavMode } from "@/hooks/use-arch-navigate"
import { ArchCard } from "./arch-card"
import styles from "./arch-card-list.module.css"

/**
 * A gapped column of ArchCards — the shared row rendering for the paginated
 * scroll list (favorites / filter results) and each suggestion axis. The click
 * `mode` is forwarded to every card so the call site owns the history strategy.
 */
export function ArchCardList({
  archs,
  mode,
}: {
  archs: ArchSummary[]
  mode: NavMode
}) {
  return (
    <div className={styles.list}>
      {archs.map((arch) => (
        <ArchCard key={arch.slug} arch={arch} mode={mode} />
      ))}
    </div>
  )
}

const PAGE_SIZE = 20

/**
 * Paginated ArchCardList — renders PAGE_SIZE rows at a time and grows as the
 * trailing sentinel scrolls into view. `renderCount` only ever grows, so
 * changing the underlying list mid-scroll never yanks the user back to the top.
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
    <div className={styles.scrollArea}>
      <ArchCardList archs={visible} mode="push" />
      {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
    </div>
  )
}
