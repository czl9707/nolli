import { useEffect, useRef } from "react"
import type { ArchSummary } from "@/lib/data/architectures.type"
import { useMapSelectStore } from "@/stores/map-select"
import { Box } from "lucide-react"
import { SidebarCard } from "./sidebar-card"
import styles from "./arch-card.module.css"

export function ArchCard({ arch }: { arch: ArchSummary }) {
  const selectedSummary = useMapSelectStore((s) => s.selectedSummary)
  const selectOnMap = useMapSelectStore((s) => s.selectOnMap)
  const deselectOnMap = useMapSelectStore((s) => s.deselectOnMap)
  const isSelected = selectedSummary?.slug === arch.slug

  const handleClick = () => {
    if (isSelected) {
      deselectOnMap()
    } else {
      selectOnMap(arch)
    }
  }

  return (
    <SidebarCard
      className={styles.archCard}
      data-selected={isSelected}
      onClick={handleClick}
    >
      {arch.coverImage ? (
        <img
          className={`${styles.thumbnail} ${styles.image}`}
          src={arch.coverImage}
          alt={arch.name}
          loading="lazy"
        />
      ) : (
        <div className={`${styles.thumbnail} ${styles.placeholder}`}>
          <Box size={16} opacity={0.3} />
        </div>
      )}
      <div className={styles.textBlock}>
        <span className={styles.name}>{arch.name}</span>
        <span className={styles.architect}>{arch.architect}</span>
      </div>
    </SidebarCard>
  )
}

export function ArchCardSkeleton({
  onLoadMore,
}: {
  onLoadMore: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [onLoadMore])

  return (
    <SidebarCard
      ref={ref}
      className={`${styles.archCard} ${styles.skeletonCard}`}
    >
      <div className={`${styles.thumbnail} ${styles.imagePulse}`} />
      <div className={styles.textBlock}>
        <div className={`${styles.line} ${styles.line1}`} />
        <div className={`${styles.line} ${styles.line2}`} />
      </div>
    </SidebarCard>
  )
}
