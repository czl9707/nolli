import { Heart } from "lucide-react"
import { useFavoritesStore } from "@/stores/favorites"
import styles from "./favorite-indicator.module.css"

/**
 * Read-only heart badge for list cards. Renders a filled, colored heart ONLY
 * when the arch is favorited; renders nothing otherwise. Never interactive —
 * the clickable toggle lives on the detail surfaces (ArchSummary, MetadataItem).
 *
 * Hooks are called unconditionally at the top, before any early return, so the
 * rules of hooks hold across renders regardless of AUTH_ENABLED / ids contents.
 */
export function FavoriteIndicator({ id }: { id: number }) {
  const ids = useFavoritesStore((s) => s.ids)

  if (!ids.includes(id)) return null
  return <Heart size={14} className={styles.indicator} />
}
