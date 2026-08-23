import type { SceneCamera } from "@nolli/map"

/** Web-mercator world coordinates normalized to 0..1 (the projection behind
 * MapLibre's tile pyramid: world px = 512 * 2^zoom). projY DECREASES as lat
 * increases — north is smaller y. */
const projX = (lng: number) => lng / 360 + 0.5
const projY = (lat: number) => {
  const s = Math.sin((lat * Math.PI) / 180)
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)
}
const invProjY = (y: number) =>
  (2 * Math.atan(Math.exp(Math.PI * (1 - 2 * y))) * 180) / Math.PI - 90

/** Camera fitting a set of points into a viewport (px), like fitBounds with
 * fixed padding. Vertical padding is asymmetric by default: photo markers
 * anchor at their pin tip and the card hangs ~220px BELOW the point, so the
 * south-most pick needs far more room below it than the north-most needs
 * above. Center is the mercator midpoint of the bounds, shifted to center
 * the points inside the padded band (not the arithmetic lat mean). */
export function fitCamera(
  points: { lng: number; lat: number }[],
  viewport: { width: number; height: number },
  padding = { x: 100, top: 120, bottom: 340 },
): SceneCamera {
  if (!points.length) throw new Error("fitCamera needs at least one point")
  const lngs = points.map((p) => p.lng)
  const lats = points.map((p) => p.lat)
  const west = Math.min(...lngs)
  const east = Math.max(...lngs)
  const south = Math.min(...lats)
  const north = Math.max(...lats)
  const spanX = Math.max(projX(east) - projX(west), 1e-9)
  const spanY = Math.max(projY(south) - projY(north), 1e-9)
  const availW = Math.max(viewport.width - padding.x * 2, 1)
  const availH = Math.max(viewport.height - padding.top - padding.bottom, 1)
  const zoom = Math.min(
    Math.log2(availW / (spanX * 512)),
    Math.log2(availH / (spanY * 512)),
    18,
  )
  const scale = 512 * 2 ** zoom
  const centerY =
    (projY(north) + projY(south)) / 2 + (padding.bottom - padding.top) / (2 * scale)
  return { center: [(west + east) / 2, invProjY(centerY)], zoom }
}
