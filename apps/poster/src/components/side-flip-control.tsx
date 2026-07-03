import { useRouteStore } from "@/stores/route"
import { useUiStore } from "@/stores/ui"
import type { Side } from "@/lib/url-state"
import styles from "./side-flip-control.module.css"

const SIDES: Side[] = ["left", "right", "top", "bottom"]

/** Shown only in spotlight editing state. Flips the photo side; updates the URL. */
export function SideFlipControl() {
  const captureMode = useUiStore((s) => s.captureMode)
  const side = useRouteStore((s) => s.side)
  const setSide = useRouteStore((s) => s.setSide)
  if (captureMode) return null

  return (
    <div className={styles.wrap}>
      {SIDES.map((s) => (
        <button
          key={s}
          className={`${styles.btn} ${s === side ? styles.active : ""}`}
          onClick={() => setSide(s)}
          aria-pressed={s === side}
          aria-label={`Photo on ${s}`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
