// apps/poster/src/components/spotlight-caption.tsx
import { useMemo } from "react"
import { useSelectionStore } from "@/stores/selection"
import { useSpotlightStore } from "@/stores/spotlight"
import { useFrameSize } from "@/hooks/use-frame-size"
import { OPPOSITE_EDGE } from "@/lib/spotlight-types"
import type { ArchSummary } from "@nolli/data"
import styles from "./spotlight-caption.module.css"

/** Wrap margin around the caption, matching the CSS --spacing-component. */
const MARGIN = 32

/**
 * Typographic caption overlaid directly on the map: Inter (not the playful
 * Body scale) with a text-shadow for legibility. Docked to the edge OPPOSITE
 * the image strip. `customName` / `customArchitect`, when non-empty, override
 * the building's real values. Direction is derived from the image edge —
 * left/right → vertical, top/bottom → horizontal — so it is not a knob.
 *
 * start/end is along the docked edge (horizontal: start=left/end=right;
 * vertical: start=bottom/end=top). Horizontal uses flexbox; vertical takes the
 * block out of flow (absolute) because writing-mode + flexbox misrenders glyphs
 * and edge alignment. Vertical mode bounds the block's length to the available
 * edge space so a long name wraps instead of overflowing.
 */
export function SpotlightCaption({ buildings }: { buildings: ArchSummary[] }) {
  const corner = useSpotlightStore((s) => s.captionCorner)
  const nameSize = useSpotlightStore((s) => s.nameSize)
  const architectSize = useSpotlightStore((s) => s.architectSize)
  const customName = useSpotlightStore((s) => s.customName)
  const customArchitect = useSpotlightStore((s) => s.customArchitect)
  const imageEdge = useSpotlightStore((s) => s.imageEdge)
  const selected = useSelectionStore((s) => s.selected)
  const frame = useFrameSize()

  const building = useMemo(() => {
    const slug = Array.from(selected)[0]
    return buildings.find((b) => b.slug === slug) ?? null
  }, [selected, buildings])

  if (!building) return null

  const vertical = imageEdge === "left" || imageEdge === "right"
  const dockEdge = OPPOSITE_EDGE[imageEdge]
  const name = customName.trim() || building.name
  const architect = customArchitect.trim() || building.architect
  const boxSize = Math.min(frame.width, (frame.height - frame.headerHeight )) - MARGIN * 2;
  const cls = [styles.wrap]
  cls.push(vertical ? styles.vert : styles.horiz, styles[dockEdge], styles[corner])
  

  return (
    <div className={cls.join(" ")}>
      <div className={styles.block} style={{ width: boxSize, height: boxSize }}>
        <span className={styles.name} style={{ fontSize: nameSize }}>
          {name}
        </span>
        <span className={styles.architect} style={{ fontSize: architectSize }}>
          {architect}
        </span>
      </div>
    </div>
  )
}
