import { useMemo } from "react"
import { useRouteStore } from "@/stores/route"
import { useSelectionStore } from "@/stores/selection"
import { Body1, Body3 } from "@nolli/ui"
import type { PosterBuilding } from "@/types"
import { paperClipPath } from "./paper-clip"
import styles from "./spotlight-overlay.module.css"

export function SpotlightOverlay({ buildings }: { buildings: PosterBuilding[] }) {
  const side = useRouteStore((s) => s.side)
  const selected = useSelectionStore((s) => s.selected)

  const building = useMemo(() => {
    const slug = Array.from(selected)[0]
    return buildings.find((b) => b.slug === slug) ?? null
  }, [selected, buildings])

  // Deterministic torn-paper edge per building, same helper as the overview
  // photo markers and @nolli/board.
  const clipPath = useMemo(
    () => (building ? paperClipPath(building.slug) : undefined),
    [building]
  )

  if (!building) return null

  const ratio = building.cover.width / building.cover.height

  return (
    <figure
      className={`${styles.hero} ${styles[side]}`}
      style={{ "--ratio": ratio, clipPath } as React.CSSProperties}
    >
      <img className={styles.photo} src={building.cover.image} alt={building.name} />
      <figcaption className={styles.caption}>
        <Body1 className={styles.name}>{building.name}</Body1>
        <Body3 className={styles.architect}>{building.architect}</Body3>
      </figcaption>
    </figure>
  )
}
