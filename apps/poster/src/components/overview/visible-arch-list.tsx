import { useSelectionStore } from "@/stores/selection"
import { Checkbox } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"
import { ArchList, ArchListItemBody } from "../shared/arch-list"
import styles from "../shared/arch-list.module.css"

/**
 * Overview-mode building list: multi-select. Each row is a <label> wrapping a
 * <Checkbox>, so the whole surface toggles membership in the selection set.
 * List chrome + row body are shared via <ArchList> / <ArchListItemBody>.
 */
export function VisibleArchList({
  buildings,
}: {
  buildings: ArchSummary[]
}) {
  const selected = useSelectionStore((s) => s.selected)
  const toggle = useSelectionStore((s) => s.toggle)

  return (
    <ArchList
      buildings={buildings}
      renderItem={(b) => (
        <label className={styles.row}>
          <Checkbox
            checked={selected.has(b.slug)}
            onCheckedChange={() => toggle(b.slug)}
            aria-label={b.name}
          />
          <ArchListItemBody building={b} />
        </label>
      )}
    />
  )
}
