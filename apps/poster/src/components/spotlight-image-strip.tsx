// apps/poster/src/components/spotlight-image-strip.tsx
import { useMemo } from "react"
import { motion } from "framer-motion"
import { useSelectionStore } from "@/stores/selection"
import { useSpotlightStore } from "@/stores/spotlight"
import { useFrameSize } from "@/hooks/use-frame-size"
import { OPPOSITE_EDGE, OPPOSITE_CORNER } from "@/lib/spotlight-types"
import { spotlightImageBounds } from "@/lib/spotlight-geometry"
import { MAP_TRANSITION_SHORT } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"
import { paperClipPath } from "./paper-clip"
import styles from "./spotlight-image-strip.module.css"

/** Wrap margin + polaroid padding, matching the CSS vars on .wrap/.hero. */
const MARGIN = 32 // --spacing-component (the .wrap margin)
const PADDING = 16 // --spacing-paragraph (the .hero padding)

/**
 * Edge-docked hero photo. Fills along its primary axis, capped on the cross
 * axis (45%), sized live from the poster frame. Torn-paper clip + grass-paper
 * backing are unchanged from the prior overlay; the in-card caption is gone.
 */
export function SpotlightImageStrip({ buildings }: { buildings: ArchSummary[] }) {
  // The image docks opposite the caption; its edge/corner are derived.
  const captionEdge = useSpotlightStore((s) => s.captionEdge)
  const captionCorner = useSpotlightStore((s) => s.captionCorner)
  const imageEdge = OPPOSITE_EDGE[captionEdge]
  const imageCorner = OPPOSITE_CORNER[captionCorner]
  const selected = useSelectionStore((s) => s.selected)
  const frame = useFrameSize()

  const building = useMemo(() => {
    const slug = Array.from(selected)[0]
    return buildings.find((b) => b.slug === slug) ?? null
  }, [selected, buildings])

  const clipPath = useMemo(
    () => (building ? paperClipPath(building.slug) : undefined),
    [building]
  )

  if (!building) return null

  const ratio = building.cover.width / building.cover.height
  const { maxWidth, maxHeight } =
    frame.width && frame.height
      ? spotlightImageBounds(imageEdge, frame.width, frame.height, frame.headerHeight, MARGIN, PADDING)
      : { maxWidth: 0, maxHeight: 0 }

  let renderW = 0
  let renderH = 0
  if (maxWidth && maxHeight) {
    renderW = maxWidth
    renderH = renderW / ratio
    if (renderH > maxHeight) {
      renderH = maxHeight
      renderW = renderH * ratio
    }
  }

  return (
    <motion.div
      layout="position"
      transition={{ duration: MAP_TRANSITION_SHORT, ease: "easeInOut" }}
      className={`${styles.wrap} ${styles[imageEdge]} ${styles[imageCorner]}`}
    >
      <figure className={styles.img} style={{ clipPath }}>
        <img
          className={styles.photo}
          style={{ width: renderW, height: renderH }}
          src={building.cover.image}
          alt={building.name}
          crossOrigin="anonymous"
        />
      </figure>
    </motion.div>
  )
}
