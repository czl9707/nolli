import { useEffect, useRef } from "react"
import type { ArchSummary } from "@/lib/data/architectures.type"
import { useArchDetailStore } from "@/stores/arch-detail"
import { SidebarCard } from "./sidebar-card"
import styles from "./arch-card.module.css"
import { Body1, Body2 } from "../ui/typography"
import { useDbStore } from "@/stores/db"

export function ArchCard({ arch }: { arch: ArchSummary }) {
  const selectedArch = useArchDetailStore((s) => s.selected)
  const selectArch = useArchDetailStore((s) => s.select)
  const dataSource = useDbStore((s) => s.dataSource)
  const isSelected = selectedArch?.slug === arch.slug

  return (
    <SidebarCard
      className={styles.archCard}
      data-selected={isSelected}
      onClick={() => {
        selectArch(arch.slug, dataSource!);
      }}
    >
      <img
        className={`${styles.thumbnail} ${styles.image}`}
        src={arch.coverImage!}
        alt={arch.name}
        loading="lazy"
      />
      <div className={styles.textBlock}>
        <Body1 className={styles.name}>{arch.name}</Body1>
        <Body2 className={styles.architect}>{arch.architect}</Body2>
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
