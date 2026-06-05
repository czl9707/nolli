import { create } from "zustand"
import type { ArchSummary } from "@/lib/data/architectures.type"

type MapSelectState = {
  selectedSummary: ArchSummary | null
  selectOnMap: (summary: ArchSummary) => void
  deselectOnMap: () => void
}

export const useMapSelectStore = create<MapSelectState>((set) => ({
  selectedSummary: null,

  selectOnMap: (summary) => {
    set({ selectedSummary: summary })
  },

  deselectOnMap: () => {
    set({ selectedSummary: null })
  },
}))
