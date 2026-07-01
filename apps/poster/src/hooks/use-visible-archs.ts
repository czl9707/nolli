import { useEffect, useState } from "react"
import type MapLibreGL from "maplibre-gl"
import type { PosterBuilding } from "@/types"

type Bounds = { west: number; south: number; east: number; north: number }

/** Pure: true if [lng,lat] falls inside the bounds. */
export function withinBounds(
  bounds: Bounds,
  lng: number,
  lat: number
): boolean {
  return (
    lng >= bounds.west &&
    lng <= bounds.east &&
    lat >= bounds.south &&
    lat <= bounds.north
  )
}

function readBounds(map: MapLibreGL.Map): Bounds {
  const b = map.getBounds()
  return {
    west: b.getWest(),
    south: b.getSouth(),
    east: b.getEast(),
    north: b.getNorth(),
  }
}

/** Buildings currently inside the map viewport. Recomputed on pan/zoom. */
export function useVisibleArchs(
  map: MapLibreGL.Map | null,
  buildings: PosterBuilding[]
): PosterBuilding[] {
  const [visible, setVisible] = useState<PosterBuilding[]>([])

  useEffect(() => {
    if (!map) return

    const update = () => {
      const bounds = readBounds(map)
      setVisible(
        buildings.filter((b) =>
          withinBounds(bounds, b.coordinates.lng, b.coordinates.lat)
        )
      )
    }

    update()
    map.on("moveend", update)
    map.on("zoomend", update)
    return () => {
      map.off("moveend", update)
      map.off("zoomend", update)
    }
  }, [map, buildings])

  return visible
}
