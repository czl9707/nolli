import { create } from "zustand"
import type MapLibreGL from "maplibre-gl"

type MapInstanceState = {
  map: MapLibreGL.Map | null
  setMap: (map: MapLibreGL.Map | null) => void
}

export const useMapInstanceStore = create<MapInstanceState>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
}))
