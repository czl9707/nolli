// apps/poster/src/components/spotlight/spotlight-image-strip.tsx
import { useMemo } from "react"
import { motion } from "framer-motion"
import { useSelectionStore } from "@/stores/selection"
import { useCaptionStore } from "@/stores/caption"
import { useFrameSize } from "@/hooks/use-frame-size"
import { OPPOSITE_EDGE, OPPOSITE_CORNER } from "@/lib/caption-types"
import { spotlightImageBounds } from "@/lib/spotlight-geometry"
import { MAP_TRANSITION_SHORT } from "@nolli/ui"
import { paperClipPath } from "../shared/paper-clip"
import styles from "./spotlight-image-strip.module.css"

/** Wrap margin + polaroid padding, matching the CSS vars on .wrap/.hero. */
const MARGIN = 32 // --spacing-component (the .wrap margin)
const PADDING = 16 // --spacing-paragraph (the .hero padding)

/**
 * Edge-docked hero photo. Fills along its primary axis, capped on the cross
 * axis (45%), sized live from the poster frame. Torn-paper clip + grass-paper
 * backing are unchanged from the prior overlay; the in-card caption is gone.
 */
export function SpotlightImageStrip() {
  // The image docks opposite the caption; its edge/corner are derived.
  const captionEdge = useCaptionStore((s) => s.captionEdge)
  const captionCorner = useCaptionStore((s) => s.captionCorner)
  const imageEdge = OPPOSITE_EDGE[captionEdge]
  const imageCorner = OPPOSITE_CORNER[captionCorner]
  const selected = useSelectionStore((s) => s.selected)
  const summaries = useSelectionStore((s) => s.summaries)
  const slug = Array.from(selected)[0]
  const frame = useFrameSize()

  const arch = slug ? summaries[slug] ?? null : null

  const clipPath = useMemo(
    () => (arch ? paperClipPath(arch.slug) : undefined),
    [arch]
  )

  if (!arch) return null

  const ratio = arch.cover.width / arch.cover.height
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
          src={arch.cover.image}
          alt={arch.name}
          crossOrigin="anonymous"
        />
      </figure>
    </motion.div>
  )
}
