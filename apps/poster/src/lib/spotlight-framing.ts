import type { Side } from "./url-state"

/**
 * Pan vector (screen px) applied AFTER centering the map on the spotlighted
 * building, so the marker lands centered in the quadrant opposite the photo.
 *
 * panBy shifts the camera: +x = east, +y = south. To move the building (at
 * center) westward on screen, pan the camera east (+x). So the vector points
 * TOWARD the photo corner by 25% of each canvas dimension — a diagonal shift
 * that places the building at the center of the opposite quadrant.
 */
export function spotlightPanVector(
  side: Side,
  width: number,
  height: number
): [number, number] {
  const qx = Math.round(width * 0.25)
  const qy = Math.round(height * 0.25)
  switch (side) {
    case "top-right":
      return [qx, -qy]
    case "top-left":
      return [-qx, -qy]
    case "bottom-right":
      return [qx, qy]
    case "bottom-left":
      return [-qx, qy]
  }
}
