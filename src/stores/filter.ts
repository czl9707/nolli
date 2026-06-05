import { create } from "zustand"
import type { ArchFilter } from "@/lib/data/data-source.type"

type FilterState = {
  architectIds: number[]
  cityIds: number[]
  getArchFilter: () => ArchFilter | undefined
  toggleArchitect: (id: number) => void
  toggleCity: (id: number) => void
  toggleCountry: (cityIdsInCountry: number[]) => void
  clearCity: () => void
  clearArchitect: () => void
}

export const useFilterStore = create<FilterState>((set, get) => ({
  architectIds: [],
  cityIds: [],

  getArchFilter: () => {
    const { architectIds, cityIds } = get()
    if (!architectIds.length && !cityIds.length) return undefined
    return {
      ...(architectIds.length ? { architectIds } : {}),
      ...(cityIds.length ? { cityIds } : {}),
    }
  },

  toggleArchitect: (id) => {
    const ids = get().architectIds
    set({
      architectIds: ids.includes(id)
        ? ids.filter((i) => i !== id)
        : [...ids, id],
    })
  },

  toggleCity: (id) => {
    const ids = get().cityIds
    set({
      cityIds: ids.includes(id)
        ? ids.filter((i) => i !== id)
        : [...ids, id],
    })
  },

  toggleCountry: (cityIdsInCountry) => {
    const current = get().cityIds
    const allSelected = cityIdsInCountry.every((id) =>
      current.includes(id),
    )
    if (allSelected) {
      set({
        cityIds: current.filter(
          (id) => !cityIdsInCountry.includes(id),
        ),
      })
    } else {
      set({
        cityIds: [
          ...new Set([...current, ...cityIdsInCountry]),
        ],
      })
    }
  },

  clearCity: () => set({ cityIds: [] }),
  clearArchitect: () => set({ architectIds: [] }),
}))
