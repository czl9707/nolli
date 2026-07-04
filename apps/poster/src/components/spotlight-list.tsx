import { useSelectionStore } from "@/stores/selection"
import { Body2, Body3, ScrollArea } from "@nolli/ui"
import type { PosterBuilding } from "@/types"
import styles from "./spotlight-list.module.css"

/**
 * Spotlight-mode building list: clickable cards (no checkboxes). Clicking a
 * card makes that building the spotlighted one (replaces the selection) and the
 * map flies to it. Mirrors the overview list's card styling but is select-one
 * instead of multi-select.
 */
export function SpotlightList({
  buildings,
}: {
  buildings: PosterBuilding[]
}) {
  const selected = useSelectionStore((s) => s.selected)
  const setAll = useSelectionStore((s) => s.setAll)
  const activeSlug = selected.size ? Array.from(selected)[0] : null

  return (
    <ScrollArea className={styles.scroll}>
      <div className={styles.list}>
        {buildings.map((b) => (
          <button
            key={b.slug}
            className={`${styles.row} ${activeSlug === b.slug ? styles.active : ""}`}
            onClick={() => setAll(new Set([b.slug]))}
            aria-label={`Spotlight ${b.name}`}
            aria-pressed={activeSlug === b.slug}
          >
            <img className={styles.thumb} src={b.cover.image} alt="" crossOrigin="anonymous" />
            <span className={styles.text}>
              <Body2 className={styles.name}>{b.name}</Body2>
              <Body3 className={styles.architect}>{b.architect}</Body3>
            </span>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}
