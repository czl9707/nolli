import { useSelectionStore } from "@/stores/selection"
import { Body2, Body3, Checkbox, ScrollArea } from "@nolli/ui"
import type { PosterBuilding } from "@/types"
import styles from "./visible-arch-list.module.css"

export function VisibleArchList({
  buildings,
}: {
  buildings: PosterBuilding[]
}) {
  const selected = useSelectionStore((s) => s.selected)
  const toggle = useSelectionStore((s) => s.toggle)

  return (
    <ScrollArea className={styles.scroll}>
      <div className={styles.list}>
        {buildings.map((b) => {
          const isSel = selected.has(b.slug)
          return (
            <label key={b.slug} className={styles.row}>
              <Checkbox
                checked={isSel}
                onCheckedChange={() => toggle(b.slug)}
                aria-label={b.name}
              />
              <img className={styles.thumb} src={b.cover.image} alt="" />
              <span className={styles.text}>
                <Body2 className={styles.name}>{b.name}</Body2>
                <Body3 className={styles.architect}>{b.architect}</Body3>
              </span>
            </label>
          )
        })}
      </div>
    </ScrollArea>
  )
}
