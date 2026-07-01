import { useSelectionStore } from "@/stores/selection"
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
    <div className={styles.list}>
      {buildings.map((b) => {
        const isSel = selected.has(b.slug)
        return (
          <label key={b.slug} className={styles.row}>
            <input
              type="checkbox"
              className={styles.check}
              checked={isSel}
              onChange={() => toggle(b.slug)}
            />
            <img className={styles.thumb} src={b.cover.image} alt="" />
            <span className={styles.name}>
              {b.name}
              <span className={styles.architect}> · {b.architect}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
