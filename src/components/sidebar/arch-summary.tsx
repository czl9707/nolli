import { useRef } from "react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useNavigate } from "react-router"
import { H4, Body1 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft } from "lucide-react"
import { SidebarCard } from "./sidebar-card"
import styles from "./arch-summary.module.css"

export function ArchSummary() {
  const arch = useArchDetailStore((s) => s.selected)
  const deselectArch = useArchDetailStore((s) => s.deselect)
  const navigate = useNavigate()

  const archRef = useRef(arch)
  if (arch) archRef.current = arch
  const current = archRef.current

  if (!current) return null

  const cover = current.coverImage

  return (
    <>
      <SidebarCard className={styles.coverWrapper}>
        <Button
          className={styles.returnButton}
          variant="secondary"
          size="icon"
          onClick={() => deselectArch()}
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
        </Button>
        <img className={styles.cover} src={cover ?? ""} alt={current.name} />
      </SidebarCard>
      <SidebarCard
        className={styles.archCard}
        onClick={() => navigate(`/arch/${current.slug}`)}
      >
        <H4 className={styles.heading}>{current.name}</H4>
        <Body1 className={styles.detail}>
          <span className={styles.muted}>By </span>
          {current.architect}
          <span className={styles.muted}> in </span>
          {current.year}
        </Body1>
        <Button variant="link" className={styles.viewLink}>
          Pin Up ! <ArrowRight size={16} />
        </Button>
      </SidebarCard>
    </>
  )
}
