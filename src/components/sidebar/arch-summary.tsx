import { useArchDetailStore } from "@/stores/arch-detail"
import { useNavigate } from "react-router"
import { H4, Body1 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { ArrowRight, X } from "lucide-react"
import { SidebarCard } from "./sidebar-card"
import styles from "./arch-summary.module.css"

export function ArchSummary() {
  const arch = useArchDetailStore((s) => s.selectedArch)
  const deselectArch = useArchDetailStore((s) => s.deselectArch)
  const navigate = useNavigate()

  if (!arch) return null

  const cover = arch.coverImage

  return (
    <>
      <SidebarCard className={styles.coverWrapper}>
        <Button
          className={styles.closeButton}
          variant="secondary"
          size="icon"
          onClick={() => deselectArch()}
          aria-label="Close"
        >
          <X size={18} />
        </Button>
        <img className={styles.cover} src={cover ?? ""} alt={arch.name} />
      </SidebarCard>
      <SidebarCard
        className={styles.archCard}
        onClick={() => navigate(`/arch/${arch.slug}`)}
      >
        <H4 className={styles.heading}>{arch.name}</H4>
        <Body1 className={styles.detail}>
          <span className={styles.muted}>By </span>
          {arch.architect}
          <span className={styles.muted}> in </span>
          {arch.year}
        </Body1>
        <Button variant="link" className={styles.viewLink}>
          Pin Up ! <ArrowRight size={16} />
        </Button>
      </SidebarCard>
    </>
  )
}
