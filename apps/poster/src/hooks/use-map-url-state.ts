import { useEffect, useRef } from "react"
import type MapLibreGL from "maplibre-gl"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useSelectionStore } from "@/stores/selection"
import { parseMapParams, serializeMapParams } from "@/lib/url-state"

/**
 * Keeps the map's center, zoom, and the current selection synchronized with the
 * URL query string.
 *
 * On mount: parses `?center=&zoom=&selection=` and hydrates the selection store.
 * When the map is ready: snaps the view with `jumpTo` (no animation).
 * Continuously: on `moveend`/`zoomend` and on selection changes, serializes the
 * current state back to the URL via `history.replaceState` (no history entries).
 */
export function useMapUrlState(buildingsReady: boolean) {
  const map = useMapInstanceStore((s) => s.map)

  // Parse + hydrate selection once on mount.
  const didHydrateRef = useRef(false)
  useEffect(() => {
    if (didHydrateRef.current) return
    didHydrateRef.current = true
    const parsed = parseMapParams(window.location.search)
    if (parsed.selection.size > 0) {
      useSelectionStore.getState().setAll(parsed.selection)
    }
  }, [])

  // Snap the view once the map + data are ready.
  const didSnapRef = useRef(false)
  useEffect(() => {
    if (didSnapRef.current) return
    if (!map || !buildingsReady) return
    const parsed = parseMapParams(window.location.search)
    if (parsed.center && parsed.zoom !== undefined) {
      map.jumpTo({ center: parsed.center, zoom: parsed.zoom })
    }
    didSnapRef.current = true
  }, [map, buildingsReady])

  // Write URL on map movement.
  useEffect(() => {
    if (!map) return
    const write = () => writeUrl(map)
    map.on("moveend", write)
    map.on("zoomend", write)
    return () => {
      map.off("moveend", write)
      map.off("zoomend", write)
    }
  }, [map])

  // Write URL on selection change.
  useEffect(() => {
    return useSelectionStore.subscribe(() => writeUrl(map))
  }, [map])
}

function writeUrl(map: MapLibreGL.Map | null) {
  const selected = useSelectionStore.getState().selected
  let center: [number, number] | undefined
  let zoom: number | undefined
  if (map) {
    const c = map.getCenter()
    center = [c.lng, c.lat]
    zoom = map.getZoom()
  }

  const query = serializeMapParams({ center, zoom, selection: selected })
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname

  window.history.replaceState(null, "", nextUrl)
}
