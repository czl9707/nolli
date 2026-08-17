import { useRef, useState } from "react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useNavigate } from "react-router"
import { Body1, Skeleton } from "@nolli/ui"
import { Button } from "@nolli/ui"
import { ArrowRight, ChevronLeft, MapPin, User } from "lucide-react"
import { SidebarCard } from "@/components/card/sidebar-card"
import { FavoriteToggle } from "../favorite/favorite-toggle"
import { ArchSuggestions } from "./arch-suggestions"
import styles from "./arch-summary.module.css"

export function ArchSummary() {
  const arch = useArchDetailStore((s) => s.selected)
  const navigate = useNavigate()

  const archRef = useRef(arch)
  if (arch) archRef.current = arch
  const current = archRef.current

  if (!current) return null

  const cover = current.cover.image
  const mapUrl = current.links?.googleMaps

  return (
    <div className={styles.summaryScroll}>
      <div className={styles.summaryScrollContent}>
        <SidebarCard className={styles.summaryCard}>
          <div className={styles.coverWrapper}>
            <Button
              className={styles.returnButton}
              variant="secondary"
              size="icon"
              onClick={() => {
                // History back if there's a prior in-app entry; otherwise go home.
                // Guards against `back()` exiting the app when deep-linked in cold.
                if ((window.history.state?.idx ?? 0) > 0) {
                  navigate(-1)
                } else {
                  navigate("/")
                }
              }}
              aria-label="Go back"
            >
              <ChevronLeft size={18} />
            </Button>
            <div className={styles.favoriteButton}>
              <FavoriteToggle id={current.id} />
            </div>
            <Cover key={current.slug} src={cover} alt={current.name} />
            <div className={styles.coverOverlay} />
            <Body1 className={styles.title}>{current.name}</Body1>
          </div>

          <div className={styles.info}>
            <Body1 className={styles.row}>
              <User size={14} className={styles.rowIcon} />
              <span className={styles.muted}>By </span>
              {current.architect}
              <span className={styles.muted}>, In </span>
              {current.year}
            </Body1>

            <a
              className={`${styles.row} ${styles.locationRow}`}
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={14} className={styles.rowIcon} />
              <Button
                variant="link"
                className={styles.locationLink}
                asChild
              >
                <Body1 className={styles.locationText}>
                  {current.city}, {current.country}
                </Body1>
              </Button>
            </a>

            <Button
              variant="link"
              className={styles.viewLink}
              onClick={() => navigate(`/arch/${current.slug}/board`)}
            >
              Go to Pin Board <ArrowRight size={16} />
            </Button>
          </div>
        </SidebarCard>

        <ArchSuggestions />
      </div>
    </div>
  )
}

function Cover({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      {!loaded && <Skeleton className={styles.coverSkeleton} />}
      <img
        className={styles.cover}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  )
}
