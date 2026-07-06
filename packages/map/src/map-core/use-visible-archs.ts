import { useMemo } from "react"
import type { ArchSummary } from "@nolli/data"
import { useMapViewportStore, type Bounds } from "./map-viewport-store"

/** Pure: true if [lng,lat] falls inside the bounds. */
export function withinBounds(
  bounds: Bounds,
  lng: number,
  lat: number,
): boolean {
  return (
    lng >= bounds.west &&
    lng <= bounds.east &&
    lat >= bounds.south &&
    lat <= bounds.north
  )
}

/**
 * Architectures currently inside the map viewport. Derives from the shared
 * `useMapViewportStore.bounds`, which a single map-side component keeps in sync
 * with the live map (see poster's `<MapUrlSync/>`). No map instance needed —
 * this is pure derivation off the viewport store.
 */
export function useVisibleArchs(archs: ArchSummary[]): ArchSummary[] {
  const bounds = useMapViewportStore((s) => s.bounds)

  return useMemo(
    () =>
      bounds
        ? archs.filter((a) =>
            withinBounds(bounds, a.coordinates.lng, a.coordinates.lat),
          )
        : [],
    [archs, bounds],
  )
}
