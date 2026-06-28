import type { ArchSummary } from "@/lib/data/architectures.type"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useArchNavigate } from "@/hooks/use-arch-navigate"
import { SidebarCard } from "./sidebar-card"
import { FavoriteToggle } from "../favorite/favorite-toggle"
import styles from "./arch-card.module.css"
import { Body1, Body2 } from "@/components/ui/typography"

export function ArchCard({ arch }: { arch: ArchSummary }) {
  const selectedArch = useArchDetailStore((s) => s.selected)
  const navigateArch = useArchNavigate()
  const isSelected = selectedArch?.slug === arch.slug

  return (
    <SidebarCard
      className={styles.archCard}
      data-selected={isSelected}
      onClick={() => navigateArch(arch.slug, true)}
    >
      <span className={styles.toggleWrap}>
        <FavoriteToggle
          id={arch.id}
          variant="ghost"
          size="icon-xs"
          iconSize={14}
          tooltipSide="left"
        />
      </span>
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
