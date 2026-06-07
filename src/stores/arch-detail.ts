import { create } from "zustand"
import type { Arch } from "@/lib/data/architectures.type"
import { useDbStore } from "@/stores/db"

type ArchDetailState = {
  selected: Arch | null
  loading: boolean
  shouldFlyTo: boolean
  select: (slug: string, shouldFlyTo: boolean) => Promise<Arch | null>
  deselect: () => void
}

export const useArchDetailStore = create<ArchDetailState>((set, get) => ({
  selected: null,
  loading: false,
  shouldFlyTo: false,

  select: async (slug: string, shouldFlyTo: boolean) => {
    const current = get().selected
    if (current?.slug === slug) return current
    const dataSource = useDbStore.getState().dataSource
    if (!dataSource) return null
    set({ loading: true })
    const arch = await dataSource.getArchBySlug(slug)
    if (arch) {
      set({
        selected: arch,
        loading: false,
        shouldFlyTo,
      })
    } else {
      set({ loading: false })
    }
    return arch
  },

  deselect: () => {
    set({ selected: null, loading: false, shouldFlyTo: false })
  },
}))
