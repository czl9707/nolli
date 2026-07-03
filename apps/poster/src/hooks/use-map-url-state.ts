import { useEffect, useRef } from "react"
import type MapLibreGL from "maplibre-gl"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useRouteStore } from "@/stores/route"
import { useSelectionStore } from "@/stores/selection"
import { parseMapParams, serializeMapParams } from "@/lib/url-state"

/**
 * Keeps the map's center, zoom, and the current selection synchronized with the
 * URL query string.
 *
 * On mount: parses `?center=&zoom=&selection=` once into a ref and hydrates the
 * selection store. When the map is ready: snaps the view with `jumpTo` (no
 * animation) using the ref, then flips a flag that lets later changes write
 * back. Continuously: on `moveend`/`zoomend` and on selection changes, the
 * current state is serialized to the URL via `history.replaceState`.
 *
 * The ref + `didSnap` gate matter because <ArchMap> sets its own initial
 * viewport (emitting `moveend`/`zoomend`) around our snap. Reading the shared
 * params from a ref (not the live URL) and refusing to write until after the
 * snap prevents that init movement from clobbering a shared `center`/`zoom`.
 */
export function useMapUrlState(buildingsReady: boolean) {
  const map = useMapInstanceStore((s) => s.map)
  const route = useRouteStore((s) => s.route)

  // Parse once on mount; subsequent reads use this ref, immune to URL rewrites.
  const initialParamsRef = useRef(parseMapParams(window.location.search))

  const didSnapRef = useRef(false)

  // Hydrate the selection store from the URL on mount.
  useEffect(() => {
    const { selection } = initialParamsRef.current
    if (selection.size > 0) {
      useSelectionStore.getState().setAll(selection)
    }
  }, [])

  // Snap the view once the map + data are ready.
  useEffect(() => {
    if (didSnapRef.current) return
    if (!map || !buildingsReady) return
    if (route === "spotlight") {
      // Spotlight owns the viewport (useSpotlightFraming); still flip the gate.
      didSnapRef.current = true
      return
    }
    const { center, zoom } = initialParamsRef.current
    if (center && zoom !== undefined) {
      map.jumpTo({ center, zoom })
    }
    didSnapRef.current = true
  }, [map, buildingsReady, route])

  // Write the URL only after the shared view has been applied — otherwise
  // pre-snap movements (e.g. <ArchMap>'s init) overwrite the incoming params.
  const writeIfReady = () => {
    if (didSnapRef.current && map) writeUrl(map)
  }

  // Write URL on map movement.
  useEffect(() => {
    if (!map) return
    map.on("moveend", writeIfReady)
    map.on("zoomend", writeIfReady)
    return () => {
      map.off("moveend", writeIfReady)
      map.off("zoomend", writeIfReady)
    }
    // writeIfReady reads didSnapRef/map via closure; deps intentionally [map].
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // Write URL on selection change.
  useEffect(() => {
    return useSelectionStore.subscribe(writeIfReady)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
}

function writeUrl(map: MapLibreGL.Map) {
  const selected = useSelectionStore.getState().selected
  const c = map.getCenter()
  const center: [number, number] = [c.lng, c.lat]
  const zoom = map.getZoom()

  const query = serializeMapParams({ center, zoom, selection: selected })
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname

  window.history.replaceState(null, "", nextUrl)
}
