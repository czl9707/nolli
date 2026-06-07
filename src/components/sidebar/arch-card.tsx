import type { ArchSummary } from "@/lib/data/architectures.type"
import { useArchDetailStore } from "@/stores/arch-detail"
import { SidebarCard } from "./sidebar-card"
import styles from "./arch-card.module.css"
import { Body1, Body2 } from "../ui/typography"

export function ArchCard({ arch }: { arch: ArchSummary }) {
  const selectedArch = useArchDetailStore((s) => s.selected)
  const selectArch = useArchDetailStore((s) => s.select)
  const isSelected = selectedArch?.slug === arch.slug

  return (
    <SidebarCard
      className={styles.archCard}
      data-selected={isSelected}
      onClick={() => {
        selectArch(arch.slug, true)
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
