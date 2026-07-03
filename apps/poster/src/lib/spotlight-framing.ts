import type { Side } from "./url-state"

/**
 * Pan vector (screen px) applied AFTER centering the map on the spotlighted
 * building, so the marker lands centered in the half opposite the photo.
 *
 * panBy shifts the camera: +x = east, +y = south. To move the building (at
 * center) westward on screen, pan the camera east (+x). So the vector points
 * TOWARD the photo side by 25% of the relevant canvas dimension.
 */
export function spotlightPanVector(
  side: Side,
  width: number,
  height: number
): [number, number] {
  const qx = Math.round(width * 0.25)
  const qy = Math.round(height * 0.25)
  switch (side) {
    case "right":
      return [qx, 0]
    case "left":
      return [-qx, 0]
    case "top":
      return [0, -qy]
    case "bottom":
      return [0, qy]
  }
}
