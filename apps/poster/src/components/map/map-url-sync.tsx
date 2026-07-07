import { useCallback, useEffect, useRef } from "react"
import { useMap, useMapViewportStore } from "@nolli/map"
import { useRouteStore } from "@/stores/route"
import { parseMapParams, setParams } from "@/lib/url-state"

/**
 * The map-side viewport controller. A child of `<ArchMap>`, so it reads the map
 * via `useMap()` (no app-local map-instance store). It owns only the map
 * viewport — `center`/`zoom` — never selection (that's `useSelectionUrlSync`).
 *
 * 1. **One-time snap** — on mount, if the URL carries `center`/`zoom` and we're
 *    not in spotlight (where `<SpotlightFraming/>` owns the viewport), `jumpTo`
 *    those params once. The map is uncontrolled otherwise.
 * 2. **Mirror map → store** — on every `moveend`/`zoomend`, write the map's
 *    `center`/`zoom`/`bounds` into the shared `useMapViewportStore`. That store
 *    is what `useVisibleArchs` filters by, so the viewport feeds the sidebar
 *    list without anyone holding the raw `MapLibreGL.Map` handle.
 * 3. **URL sync** — write `center`/`zoom` back to the query string.
 */
export function MapUrlSync() {
  const { map } = useMap()
  const route = useRouteStore((s) => s.route)
  const setViewport = useMapViewportStore((s) => s.setViewport)

  // Parse once on mount; subsequent reads use this ref, immune to URL rewrites.
  const initialParamsRef = useRef(parseMapParams(window.location.search))
  const didSnapRef = useRef(false)

  // Mirror map → store + write URL. No-op until the one-time snap has landed,
  // so pre-snap movement (e.g. <ArchMap>'s init) can't overwrite the incoming
  // params.
  const syncFromMap = useCallback(() => {
    if (!didSnapRef.current || !map) return

    const c = map.getCenter()
    const b = map.getBounds()
    const center: [number, number] = [c.lng, c.lat]
    const zoom = map.getZoom()

    setViewport({
      center,
      zoom,
      bounds: {
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      },
    })

    // Merge only the map-owned keys; preserve caption + selection (owned by
    // their own sync hooks).
    setParams({ center, zoom })
  }, [map, setViewport])

  // Snap once the map is ready, then seed the store + URL.
  useEffect(() => {
    if (didSnapRef.current || !map) return

    if (route !== "spotlight") {
      const { center, zoom } = initialParamsRef.current
      if (center && zoom !== undefined) {
        map.jumpTo({ center, zoom })
      }
    }
    didSnapRef.current = true
    syncFromMap()
  }, [map, route, syncFromMap])

  // Mirror + write on map movement.
  useEffect(() => {
    if (!map) return
    map.on("moveend", syncFromMap)
    map.on("zoomend", syncFromMap)
    return () => {
      map.off("moveend", syncFromMap)
      map.off("zoomend", syncFromMap)
    }
  }, [map, syncFromMap])

  return null
}
