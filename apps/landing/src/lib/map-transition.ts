import type MapLibreGL from "maplibre-gl"
import { SCENE_EASE, sceneFlightDurationMs, type SceneCamera } from "@nolli/map"

/** Match tolerance for "the view is already there" — a fire whose target
 * equals the live view (e.g. the reverse crossing back into a hold whose
 * camera never moved) has nothing to fly, so it skips the move. */
const CENTER_EPS = 1e-6
const ZOOM_EPS = 1e-4

/** Fly the map to the hold's camera. easeTo only: flyTo's zoom arc fights
 * the renderWorldCopies world-fit clamp and lands off-target — and any
 * flight crossing a shape morph resizes the container every frame, which
 * shoves the landing too. So the flight eases directly and is verified at
 * moveend: a landed camera off the target pins to it. */
export function applyMapTransition(map: MapLibreGL.Map, cam: SceneCamera): void {
  const c = map.getCenter()
  if (
    Math.abs(c.lng - cam.center[0]) < CENTER_EPS &&
    Math.abs(c.lat - cam.center[1]) < CENTER_EPS &&
    Math.abs(map.getZoom() - cam.zoom) < ZOOM_EPS
  )
    return
  map.stop()
  map.easeTo({
    center: cam.center,
    zoom: cam.zoom,
    duration: sceneFlightDurationMs(map, cam),
    easing: SCENE_EASE,
    essential: true,
  })
  map.once("moveend", () => {
    const e = map.getCenter()
    if (
      Math.abs(e.lng - cam.center[0]) < CENTER_EPS &&
      Math.abs(e.lat - cam.center[1]) < CENTER_EPS &&
      Math.abs(map.getZoom() - cam.zoom) < ZOOM_EPS
    )
      return
    map.jumpTo({ center: cam.center, zoom: cam.zoom })
  })
}
