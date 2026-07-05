// apps/poster/src/components/spotlight-caption.tsx
import { useMemo } from "react"
import { useSelectionStore } from "@/stores/selection"
import { useSpotlightStore } from "@/stores/spotlight"
import { useFrameSize } from "@/hooks/use-frame-size"
import { resolveCaptionCorner } from "@/lib/spotlight-types"
import type { ArchSummary } from "@nolli/data"
import styles from "./spotlight-caption.module.css"

/** Wrap margin around the caption, matching the CSS --spacing-component. */
const MARGIN = 32

/**
 * Typographic caption overlaid directly on the map: Inter (not the playful
 * Body scale) with a text-shadow for legibility. Always docked to a corner on
 * the edge opposite the image strip. `customName` / `customArchitect`, when
 * non-empty, override the building's real values. Vertical mode spins the
 * block −90° (reads vertically); in vertical mode the architect is ordered
 * flush to the docked corner — above the name at top corners, below it at
 * bottom corners. Right-docked corners right-align both lines. Vertical mode
 * also bounds the block's unrotated width to the available height so a long
 * name wraps instead of overflowing.
 */
export function SpotlightCaption({ buildings }: { buildings: ArchSummary[] }) {
  const corner = useSpotlightStore((s) => s.captionCorner)
  const direction = useSpotlightStore((s) => s.captionDirection)
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

  const frameCorner = resolveCaptionCorner(imageEdge, corner)
  const rotated = direction === "rotated"
  const alignRight = frameCorner.endsWith("right")
  const name = customName.trim() || building.name
  const architect = customArchitect.trim() || building.architect
  // Vertical: architect flush to the docked corner — top corners → architect
  // first (up), bottom corners → architect second (down).
  const architectFirst = rotated && frameCorner.startsWith("top")
  // Bound the rotated block's unrotated width (= its visual height once spun)
  // to the available vertical space so long names wrap instead of overflowing.
  const rotatedMaxWidth =
    frame.height && frame.headerHeight
      ? Math.max(0, frame.height - frame.headerHeight - 2 * MARGIN)
      : undefined

  const cls = [styles.wrap, styles[frameCorner]]
  if (rotated) cls.push(styles.rotated)
  if (alignRight) cls.push(styles.alignRight)

  const nameEl = <span className={styles.name}>{name}</span>
  const architectEl = (
    <span className={styles.architect} style={{ fontSize: architectSize }}>
      {architect}
    </span>
  )

  return (
    <div className={cls.join(" ")}>
      <div
        className={styles.block}
        style={{
          fontSize: nameSize,
          ...(rotated && rotatedMaxWidth !== undefined
            ? { maxWidth: rotatedMaxWidth }
            : {}),
        }}
      >
        {architectFirst ? <>{architectEl}{nameEl}</> : <>{nameEl}{architectEl}</>}
      </div>
    </div>
  )
}
