import type MapLibreGL from "maplibre-gl"
import { MAP_TRANSITION_SHORT, MAP_TRANSITION_LONG } from "@nolli/ui"

const DEFALT_MAP_ZOOM_LEVEL = 14;

export function flyToArchCinematic(
  map: MapLibreGL.Map,
  lng: number,
  lat: number,
  zoom: number = DEFALT_MAP_ZOOM_LEVEL,
  offset: [number, number] = [0, 0],
): void {
  const zoomDest = Math.max(map.getZoom(), zoom);
  const zoomDelta = zoomDest - map.getZoom();
  const bounds = map.getBounds();
  let duration;
  if (bounds.contains([lng, lat])) {
    duration = MAP_TRANSITION_SHORT * 1000 + (zoomDelta * 200);
  }
  else {
    duration = MAP_TRANSITION_LONG * 1000
  }

  map.stop()
  map.flyTo({
    center: [lng, lat],
    zoom: Math.max(map.getZoom(), zoom),
    offset,
    duration: duration,
    curve: 1.2,
    speed: 1.0,
    essential: true,
  })
}

export function flyToArchIfNeeded(
  map: MapLibreGL.Map,
  lng: number,
  lat: number,
): void {
  const bounds = map.getBounds()
  if (!bounds.contains([lng, lat])) {
    map.stop()
    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), DEFALT_MAP_ZOOM_LEVEL),
      duration: MAP_TRANSITION_LONG * 1000,
      essential: true,
    })
  }
}

export type SceneCamera = {
  center: [number, number]
  zoom: number
}

/** Cinematic scene-to-scene flight for scripted choreography (landing spine).
 * Unlike flyToArchCinematic: the destination zoom passes through unchanged
 * (scene flights zoom out), and duration follows the same short/long rules. */
export function flyToSceneCinematic(
  map: MapLibreGL.Map,
  camera: SceneCamera,
): void {
  const zoomDelta = Math.abs(camera.zoom - map.getZoom())
  const duration = map.getBounds().contains(camera.center)
    ? MAP_TRANSITION_SHORT * 1000 + zoomDelta * 200
    : MAP_TRANSITION_LONG * 1000

  map.stop()
  map.flyTo({
    center: camera.center,
    zoom: camera.zoom,
    duration,
    curve: 1.2,
    speed: 1.0,
    essential: true,
  })
}
