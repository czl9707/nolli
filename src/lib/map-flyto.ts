import type MapLibreGL from "maplibre-gl"
import { MAP_TRANSITION_SHORT, MAP_TRANSITION_LONG } from "@/lib/constants"

export function flyToArchCinematic(
  map: MapLibreGL.Map,
  lng: number,
  lat: number,
  zoom: number = 15,
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
      zoom: Math.max(map.getZoom(), 15),
      duration: MAP_TRANSITION_LONG * 1000,
      essential: true,
    })
  }
}
