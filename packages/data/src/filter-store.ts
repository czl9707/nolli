import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { ArchFilter } from "./data-source.type"
import type { ArchSummary } from "./architectures.type"
import type { DataSource } from "./data-source.type"
import { useDbStore } from "./db-store"

type FilterState = {
  architectIds: number[]
  cityIds: number[]
  searchQuery: string
  filteredArchs: ArchSummary[]
  error: Error | null
  getArchFilter: () => ArchFilter | undefined
  toggleArchitect: (id: number) => void
  toggleCity: (id: number) => void
  toggleCountry: (cityIdsInCountry: number[]) => void
  clearCity: () => void
  clearArchitect: () => void
  setSearchQuery: (q: string) => void
  loading: boolean
}

export const useFilterStore = create(
  subscribeWithSelector<FilterState>((set, get) => ({
    architectIds: [],
    cityIds: [],
    searchQuery: "",
    filteredArchs: [],
    error: null,
    loading: false,

    getArchFilter: () => {
      const { architectIds, cityIds, searchQuery } = get()
      const query = searchQuery.trim()
      if (!architectIds.length && !cityIds.length && !query) return undefined
      return {
        ...(architectIds.length ? { architectIds } : {}),
        ...(cityIds.length ? { cityIds } : {}),
        ...(query ? { query } : {}),
      }
    },

    toggleArchitect: (id) => {
      const ids = get().architectIds
      set({
        loading: true,
        architectIds: ids.includes(id)
          ? ids.filter((i) => i !== id)
          : [...ids, id],
      })
    },

    toggleCity: (id) => {
      const ids = get().cityIds
      set({
        loading: true,
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
          loading: true,
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

    clearCity: () => set({ cityIds: [], loading: true }),
    clearArchitect: () => set({ architectIds: [], loading: true }),
    setSearchQuery: (q) => {
      if (get().searchQuery === q) return
      set({ loading: true, searchQuery: q })
    },
  })),
)

function startFilterSync(dataSource: DataSource) {
  useFilterStore.subscribe(
    (state) => [state.architectIds, state.cityIds, state.searchQuery] as const,
    () => {
      const filter = useFilterStore.getState().getArchFilter()
      dataSource.getAllArchitectures(filter).then((archs) => {
        useFilterStore.setState({ filteredArchs: archs, loading: false, error: null })
      }).catch((error: Error) => {
        useFilterStore.setState({ loading: false, error })
      })
    },
    { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] },
  )

  dataSource
    .getAllArchitectures(undefined)
    .then((archs) => useFilterStore.setState({ filteredArchs: archs, loading: false, error: null }))
    .catch((error: Error) => {
      useFilterStore.setState({ loading: false, error })
    })
}

let prevDataSource: DataSource | null = null
useDbStore.subscribe((state) => {
  if (state.dataSource && !prevDataSource) {
    startFilterSync(state.dataSource)
  }
  prevDataSource = state.dataSource
})
