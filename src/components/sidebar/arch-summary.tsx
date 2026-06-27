import { useRef, useState } from "react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useNavigate } from "react-router"
import { H4, Body1 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, Heart, Loader2, MapPin, User } from "lucide-react"
import { SidebarCard } from "./sidebar-card"
import styles from "./arch-summary.module.css"
import { useAuthStore } from "@/stores/auth"
import { useFavoritesStore } from "@/stores/favorites"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

export function ArchSummary() {
  const arch = useArchDetailStore((s) => s.selected)
  const navigate = useNavigate()

  const archRef = useRef(arch)
  if (arch) archRef.current = arch
  const current = archRef.current

  if (!current) return null

  const cover = current.coverImage
  const mapUrl = current.links?.googleMaps

  return (
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
        <img className={styles.cover} src={cover ?? ""} alt={current.name} />
        <div className={styles.coverOverlay} />
        <H4 className={styles.title}>{current.name}</H4>
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
          className={styles.row}
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
            <Body1>
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
  )
}

function FavoriteToggle({ id }: { id: number }) {
  const user = useAuthStore((s) => s.user)
  const ids = useFavoritesStore((s) => s.ids)
  const toggle = useFavoritesStore((s) => s.toggle)
  const [loading, setLoading] = useState(false);

  const authed = !!user
  const isFav = ids.includes(id)

  const button = (
    <Button
      variant="secondary"
      size="icon"
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFav}
      disabled={loading}
      data-fav={isFav}
      className={styles.favToggle}
      onClick={authed ? (e) => {
        e.stopPropagation()
        setLoading(true)
        toggle(id).then(() => {
          setLoading(false)
        })
      }: undefined}
    >
      {loading ? (
        <Loader2 size={16} className={styles.favSpinner} />
      ) : (
        <Heart size={16} className={styles.favHeart} />
      )}
    </Button>
  )

  // Guests get a tooltip explaining why the heart is dead. Tooltip opens on
  // hover AND focus/press, so it's reachable on touch (no hover) devices.
  if (!authed) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top">
            Sign in to save favorites
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}
