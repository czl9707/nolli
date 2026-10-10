import type MapLibreGL from "maplibre-gl"
import { sceneFlightDurationMs, type SceneCamera } from "@nolli/map"

/** Match tolerance for "the view is already there" — a fire whose target
 * equals the live view (e.g. the reverse crossing back into a hold whose
 * camera never moved) has nothing to fly, so it skips the move. */
const CENTER_EPS = 1e-6
const ZOOM_EPS = 1e-4

/** The flyTo zoom-out arc — above 1 the path leaves the straight line
 * and reads as a flight. The arc dips below both endpoint zooms; once
 * that dip reaches the renderWorldCopies world-fit clamp (the zoom where
 * the world spans the viewport) the clamp floors the path and corrupts
 * the landing — so any flight touching world-scale zooms flies on the
 * straight line (curve 1 stays between the endpoints), and only
 * city-level pairs arc. */
const ARC_CURVE = 1.4

/** The zoom below which the world spans the viewport — the clamp's floor
 * for this viewport size (the desktop fallback covers node tests). */
const worldFitZoom = () => {
  const px = typeof window === "undefined" ? 1440 : Math.max(window.innerWidth, window.innerHeight)
  return Math.log2(px / 512)
}

/** Fly the map to the hold's camera on flyTo's arc. */
export function applyMapTransition(map: MapLibreGL.Map, cam: SceneCamera): void {
  const c = map.getCenter()
  if (
    Math.abs(c.lng - cam.center[0]) < CENTER_EPS &&
    Math.abs(c.lat - cam.center[1]) < CENTER_EPS &&
    Math.abs(map.getZoom() - cam.zoom) < ZOOM_EPS
  )
    return
  map.stop()
  const arc = Math.min(map.getZoom(), cam.zoom) > worldFitZoom() + 1
  map.flyTo({
    center: cam.center,
    zoom: cam.zoom,
    duration: sceneFlightDurationMs(map, cam),
    curve: arc ? ARC_CURVE : 1,
    essential: true,
  })
}
