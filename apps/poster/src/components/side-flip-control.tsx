import { Tabs, TabsList, TabsTrigger } from "@nolli/ui"
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
 * Photo-side selector for spotlight, built on the shared <Tabs>. Picks which
 * edge the hero photo floats on; the map recomposes so the marker stays
 * centered in the opposite half.
 */
export function SideFlipControl() {
  const side = useRouteStore((s) => s.side)
  const setSide = useRouteStore((s) => s.setSide)

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Photo</span>
      <Tabs value={side} onValueChange={(v) => setSide(v as Side)}>
        <TabsList>
          {SIDES.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
