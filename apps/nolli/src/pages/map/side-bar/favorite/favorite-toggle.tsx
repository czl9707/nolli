import { useState } from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@nolli/ui"
import { useAuthStore } from "@/stores/auth"
import { useFavoritesStore } from "@/stores/favorites"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@nolli/ui"
import styles from "./favorite-toggle.module.css"

type FavoriteToggleProps = {
  id: number
  /**
   * Visual treatment. "secondary" = solid chip for prominent surfaces (detail
   * cover); "ghost" = quiet, transparent, for dense rows (list cards).
   */
  variant?: "secondary" | "ghost"
  /** Hit area / icon sizing follows the design-system button sizes. */
  size?: "icon" | "icon-sm" | "icon-xs"
  /** Override the glyph size in px; defaults from `size`. */
  iconSize?: number
  tooltipSide?: "top" | "right" | "bottom" | "left"
  className?: string
}

/**
 * The single favorite heart used everywhere. Owns all the behavior — store
 * reads, in-flight loading state, the toggle call, click capture, and the guest
 * tooltip — and renders the Heart / Loader2 with the favorited fill. Surfaces
 * differ only in chrome, expressed via `variant` / `size` / `className`.
 *
 * `data-fav` is always set on the button so container CSS can key off fav state
 * (e.g. a list card reveals the empty heart only on hover).
 */
export function FavoriteToggle({
  id,
  variant = "secondary",
  size = "icon",
  iconSize,
  tooltipSide = "top",
  className,
}: FavoriteToggleProps) {
  const user = useAuthStore((s) => s.user)
  const ids = useFavoritesStore((s) => s.ids)
  const toggle = useFavoritesStore((s) => s.toggle)
  const [loading, setLoading] = useState(false)

  const authed = !!user
  const isFav = ids.includes(id)
  const resolvedIconSize = iconSize ?? (size === "icon-xs" ? 14 : 16)

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      data-fav={isFav}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFav}
      disabled={loading}
      className={className}
      onClick={(e) => {
        // Stop the click from also selecting the card / navigating.
        e.stopPropagation()
        if (!authed) return
        setLoading(true)
        void toggle(id).finally(() => setLoading(false))
      }}
    >
      {loading ? (
        <Loader2 size={resolvedIconSize} className={styles.spinner} />
      ) : (
        <Heart size={resolvedIconSize} className={styles.fav}/>
      )}
    </Button>
  )

  // Guests get a tooltip explaining why the heart is inert. Tooltip opens on
  // hover AND focus/press, so it's reachable on touch (no hover) devices.
  if (!authed) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side={tooltipSide}>Sign in to save favorites</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}
