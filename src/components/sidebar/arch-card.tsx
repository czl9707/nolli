import type { ArchSummary } from "@/lib/data/architectures.type"
import { useNavigate } from "react-router"
import { useArchDetailStore } from "@/stores/arch-detail"
import { SidebarCard } from "./sidebar-card"
import { FavoriteToggle } from "./favorite-toggle"
import styles from "./arch-card.module.css"
import { Body1, Body2 } from "../ui/typography"

export function ArchCard({ arch }: { arch: ArchSummary }) {
  const selectedArch = useArchDetailStore((s) => s.selected)
  const selectArch = useArchDetailStore((s) => s.select)
  const navigate = useNavigate()
  const isSelected = selectedArch?.slug === arch.slug

  return (
    <SidebarCard
      className={styles.archCard}
      data-selected={isSelected}
      onClick={() => {
        // Navigate after the load resolves so <ArchSync> sees the store already
        // holds this slug and early-returns — no second load, no double fly.
        void selectArch(arch.slug, true).then((loaded) => {
          if (loaded) navigate(`/arch/${arch.slug}`)
        })
      }}
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
