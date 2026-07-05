// apps/poster/src/lib/spotlight-geometry.ts
import type { ImageEdge } from "./spotlight-types"

/** Cross-axis fraction the camera shifts the marker off viewport center, so it
 *  sits centered in the half opposite the image strip. ~15% of that axis. */
const EDGE_PAN_FRACTION = 0.15
/** Cross-axis width cap for the image strip (fraction of that axis). */
const STRIP_CAP_FRACTION = 0.45

/**
 * Pixel offset (MapLibre flyTo/easeTo `offset`, screen coords: +x right, +y
 * down) that shifts the building marker into the half opposite the image
 * strip — away from the edge the strip occupies. Returned directly; no
 * negation needed at the call site.
 */
export function spotlightEdgeOffset(
  edge: ImageEdge,
  width: number,
  height: number
): [number, number] {
  switch (edge) {
    case "top":
      return [0, Math.round(height * EDGE_PAN_FRACTION)]
    case "bottom":
      return [0, -Math.round(height * EDGE_PAN_FRACTION)]
    case "left":
      return [Math.round(width * EDGE_PAN_FRACTION), 0]
    case "right":
      return [-Math.round(width * EDGE_PAN_FRACTION), 0]
  }
}

/**
 * The photo's bounding box inside the poster frame, given live measurements.
 * The `<img>` keeps its natural aspect ratio and binds whichever constraint is
 * hit first ("fill, whichever hits first").
 *
 * Both the wrap margin and the polaroid card padding eat into the available
 * space on each axis, so `margin + padding` is deducted on both sides — this
 * also keeps the strip inset from the frame edge by the margin instead of
 * bleeding past it on the filling axis.
 *
 * - left/right: fill height (minus header + chrome), width capped at 45%.
 * - top/bottom: fill width (minus chrome), height capped at 45%.
 */
export function spotlightImageBounds(
  edge: ImageEdge,
  width: number,
  height: number,
  headerHeight: number,
  margin: number,
  padding: number
): { maxWidth: number; maxHeight: number } {
  const chrome = 2 * (margin + padding)
  if (edge === "left" || edge === "right") {
    console.log("spotlightImageBounds left/right", { edge, width, height, headerHeight, margin, padding, chrome })
    console.log("spotlightImageBounds left/right", { maxWidth: Math.max(0, STRIP_CAP_FRACTION * (width - chrome)), maxHeight: Math.max(0, height - headerHeight - chrome) })
    return {
      maxWidth: Math.max(0, STRIP_CAP_FRACTION * (width - chrome)),
      maxHeight: Math.max(0, height - headerHeight - chrome),
    }
  }
  return {
    maxWidth: Math.max(0, width - chrome),
    maxHeight: Math.max(0, STRIP_CAP_FRACTION * (height - chrome)),
  }
}
