import { create } from "zustand"

export type LocationFilter =
  | { type: "country"; code: string; name: string }
  | { type: "city"; id: number; name: string; countryCode: string }

type FilterState = {
  architectIds: number[]
  locations: LocationFilter[]
  toggleArchitect: (id: number) => void
  toggleLocation: (loc: LocationFilter) => void
  clearAll: () => void
}

export const useFilterStore = create<FilterState>((set, get) => ({
  architectIds: [],
  locations: [],

  toggleArchitect: (id) => {
    const ids = get().architectIds
    set({
      architectIds: ids.includes(id)
        ? ids.filter((i) => i !== id)
        : [...ids, id],
    })
  },

  toggleLocation: (loc) => {
    const locs = get().locations
    const exists = locs.some((l) =>
      l.type === loc.type &&
      (l.type === "country"
        ? l.code === (loc as { type: "country"; code: string }).code
        : l.id === (loc as { type: "city"; id: number }).id),
    )
    if (exists) {
      set({
        locations: locs.filter((l) =>
          l.type === loc.type
            ? l.type === "country"
              ? l.code !== (loc as { type: "country"; code: string }).code
              : l.id !== (loc as { type: "city"; id: number }).id
            : true,
        ),
      })
    } else {
      if (loc.type === "country") {
        const code = (loc as { type: "country"; code: string }).code
        const filtered = locs.filter(
          (l) => !(l.type === "city" && l.countryCode === code),
        )
        set({ locations: [...filtered, loc] })
      } else {
        set({ locations: [...locs, loc] })
      }
    }
  },

  clearAll: () => set({ architectIds: [], locations: [] }),
}))
