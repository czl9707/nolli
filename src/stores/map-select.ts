import { create } from "zustand"
import type { ArchSummary } from "@/lib/data/architectures.type"

type MapSelectState = {
  selected: ArchSummary | null
  select: (summary: ArchSummary) => void
  deselect: () => void
}

export const useMapSelectStore = create<MapSelectState>((set) => ({
  selected: null,

  select: (summary) => {
    set({ selected: summary })
  },

  deselect: () => {
    set({ selected: null })
  },
}))
