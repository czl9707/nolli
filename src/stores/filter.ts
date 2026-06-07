import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { ArchFilter } from "@/lib/data/data-source.type"
import type { ArchSummary } from "@/lib/data/architectures.type"
import type { DataSource } from "@/lib/data/data-source.type"
import { useDbStore } from "@/stores/db"

type FilterState = {
  architectIds: number[]
  cityIds: number[]
  filteredArchs: ArchSummary[]
  getArchFilter: () => ArchFilter | undefined
  toggleArchitect: (id: number) => void
  toggleCity: (id: number) => void
  toggleCountry: (cityIdsInCountry: number[]) => void
  clearCity: () => void
  clearArchitect: () => void
  loading: boolean
}

export const useFilterStore = create(
  subscribeWithSelector<FilterState>((set, get) => ({
    architectIds: [],
    cityIds: [],
    filteredArchs: [],
    loading: false,

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
  })),
)

function startFilterSync(dataSource: DataSource) {
  useFilterStore.subscribe(
    (state) => [state.architectIds, state.cityIds] as const,
    () => {
      const filter = useFilterStore.getState().getArchFilter()
      dataSource.getAllArchitectures(filter).then((archs) => {
        useFilterStore.setState({ filteredArchs: archs, loading: false })
      })
    },
    { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] },
  )

  dataSource
    .getAllArchitectures(undefined)
    .then((archs) => useFilterStore.setState({ filteredArchs: archs, loading: false }))
}

let prevDataSource: DataSource | null = null
useDbStore.subscribe((state) => {
  if (state.dataSource && !prevDataSource) {
    startFilterSync(state.dataSource)
  }
  prevDataSource = state.dataSource
})
