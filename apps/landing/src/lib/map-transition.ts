import type MapLibreGL from "maplibre-gl"
import { sceneFlightDurationMs, type SceneCamera } from "@nolli/map"

/** The spine's shape-morph window — exported for the spine's placement
 * tween, which shares its timing. Every scene declares the same
 * fullscreen shape, so the tween carries no offset. */
export const SNAPSHOT_SHAPE_MS = 500

/** Match tolerance for "the view is already there" — a fire whose target
 * equals the live view (e.g. the reverse crossing back into a hold whose
 * camera never moved) has nothing to fly, so it skips the move. */
const CENTER_EPS = 1e-6
const ZOOM_EPS = 1e-4

/** The flyTo zoom-out arc — above 1 the path leaves the straight line
 * and reads as a flight. All cameras on this page sit at city-level
 * zooms, so the dip stays clear of the renderWorldCopies world-fit clamp
 * that corrupts flyTo landings on long scene flights. */
const ARC_CURVE = 1.4

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
  map.flyTo({
    center: cam.center,
    zoom: cam.zoom,
    duration: sceneFlightDurationMs(map, cam),
    curve: ARC_CURVE,
    essential: true,
  })
}
