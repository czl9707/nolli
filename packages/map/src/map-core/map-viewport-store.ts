import { create } from "zustand"

export type LngLat = [number, number]

/** Map viewport bounds in degrees. */
export type Bounds = {
  west: number
  south: number
  east: number
  north: number
}

/**
 * The map's current viewport as serializable params — `center`, `zoom`, and the
 * computed `bounds`. This holds *derived viewport data*, never the raw
 * `MapLibreGL.Map` instance. A single map-side component (a child of `<ArchMap>`,
 * using `useMap()`) mirrors map → store on movement; everything else reads it
 * (e.g. `useVisibleArchs` filters by `bounds`) without touching the imperative
 * handle. `center`/`zoom` are there for URL sync and future consumers.
 */
type MapViewportState = {
  center: LngLat | null
  zoom: number | null
  bounds: Bounds | null
  setViewport: (v: { center: LngLat; zoom: number; bounds: Bounds }) => void
}

export const useMapViewportStore = create<MapViewportState>((set) => ({
  center: null,
  zoom: null,
  bounds: null,
  setViewport: (v) => set(v),
}))
