import { useRef } from "react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useNavigate } from "react-router"
import { H4, Body1 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, MapPin, User } from "lucide-react"
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
  const locationText = [current.city, current.country]
    .filter(Boolean)
    .join(", ")
  const hasLocation = locationText.length > 0
  const mapUrl = current.links?.googleMaps

  return (
    <SidebarCard className={styles.summaryCard}>
      <div className={styles.coverWrapper}>
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
        <div className={styles.coverOverlay} />
        <H4 className={styles.title}>{current.name}</H4>
      </div>

      <div className={styles.info}>
        <Body1 className={styles.row}>
          <User size={14} className={styles.rowIcon} />
          <span className={styles.muted}>By </span>
          {current.architect}
          <span className={styles.muted}>, {current.year}</span>
        </Body1>

        {hasLocation &&
          (mapUrl ? (
            <a
              className={`${styles.row} ${styles.locationLink}`}
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={14} className={styles.rowIcon} />
              {locationText}
            </a>
          ) : (
            <Body1 className={styles.row}>
              <MapPin size={14} className={styles.rowIcon} />
              {locationText}
            </Body1>
          ))}

        <Button
          variant="link"
          className={styles.viewLink}
          onClick={() => navigate(`/arch/${current.slug}`)}
        >
          Go to Pin Board <ArrowRight size={16} />
        </Button>
      </div>
    </SidebarCard>
  )
}
