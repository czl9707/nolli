import type { ArchSummary } from "@nolli/data"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useArchNavigate, type NavMode } from "@/hooks/use-arch-navigate"
import { MediaCard } from "@/components/card/media-card"
import { FavoriteToggle } from "../favorite/favorite-toggle"
import styles from "./arch-card.module.css"

export function ArchCard({ arch, mode }: { arch: ArchSummary; mode: NavMode }) {
  const selectedArch = useArchDetailStore((s) => s.selected)
  const navigateArch = useArchNavigate()
  const isSelected = selectedArch?.slug === arch.slug

  return (
    <MediaCard
      className={styles.archCard}
      coverUrl={arch.cover.image}
      coverAlt={arch.name}
      title={arch.name}
      subtitle={arch.architect}
      data-selected={isSelected}
      onClick={() => navigateArch(arch.slug, true, mode)}
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
    </MediaCard>
  )
}
