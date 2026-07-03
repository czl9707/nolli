import { useRouteStore } from "@/stores/route"
import type { Side } from "@/lib/url-state"
import styles from "./side-flip-control.module.css"

const SIDES: { id: Side; label: string }[] = [
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
]

/**
 * Photo-side selector for spotlight, rendered inline in the sidebar. Picks
 * which edge the hero photo floats on; the map recomposes so the marker stays
 * centered in the opposite half.
 */
export function SideFlipControl() {
  const side = useRouteStore((s) => s.side)
  const setSide = useRouteStore((s) => s.setSide)

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Photo</span>
      <div className={styles.btns} role="group" aria-label="Photo side">
        {SIDES.map((s) => {
          const active = s.id === side
          return (
            <button
              key={s.id}
              className={`${styles.btn} ${active ? styles.active : ""}`}
              onClick={() => setSide(s.id)}
              aria-pressed={active}
              aria-label={`Photo on ${s.id}`}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
