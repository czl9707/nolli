import type { Arch } from "@/lib/data/architectures"
import { H4, Body1 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { ArrowRight, X } from "lucide-react"
import { SidebarCard } from "./sidebar-card"
import cardStyles from "./sidebar-card.module.css"
import styles from "./arch-summary.module.css"

export function ArchSummary({
  arch,
  onView,
  onClose,
}: {
  arch: Arch
  onView: () => void
  onClose: () => void
}) {
  const cover = arch.coverImage

  return (
    <>
      <div className={styles.coverWrapper}>
        <Button
          className={styles.closeButton}
          variant="secondary"
          size="icon"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </Button>
        <img className={styles.cover} src={cover ?? ""} alt={arch.name} />
      </div>
      <SidebarCard className={cardStyles.archCard} onClick={onView}>
        <H4 className={styles.heading}>{arch.name}</H4>
        <Body1 className={styles.detail}>
          <span className={styles.muted}>By </span>
          {arch.architect}
          <span className={styles.muted}> in </span>
          {arch.year}
        </Body1>
        <Button variant="link" className={cardStyles.viewLink}>
          Pin Up ! <ArrowRight size={16} />
        </Button>
      </SidebarCard>
    </>
  )
}
