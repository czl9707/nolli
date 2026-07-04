import { useSelectionStore } from "@/stores/selection"
import { Button } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"
import { ArchList, ArchListItemBody } from "./arch-list"
import styles from "./arch-list.module.css"

/**
 * Spotlight-mode building list: single-select. Each row is a design-system
 * <Button variant="ghost"> — clicking it makes that building the spotlighted
 * one (replaces the selection) and the map flies to it. Mirrors the overview
 * list's card styling but is select-one instead of multi-select. List chrome +
 * row body are shared via <ArchList> / <ArchListItemBody>.
 */
export function SpotlightList({
  buildings,
}: {
  buildings: ArchSummary[]
}) {
  const selected = useSelectionStore((s) => s.selected)
  const setAll = useSelectionStore((s) => s.setAll)
  const activeSlug = selected.size ? Array.from(selected)[0] : null

  return (
    <ArchList
      buildings={buildings}
      renderItem={(b) => {
        const active = activeSlug === b.slug
        return (
          <Button
            variant="ghost"
            className={`${styles.row} ${active ? styles.active : ""}`}
            onClick={() => setAll(new Set([b.slug]))}
            aria-label={`Spotlight ${b.name}`}
            aria-pressed={active}
          >
            <ArchListItemBody building={b} />
          </Button>
        )
      }}
    />
  )
}
