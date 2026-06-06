import { create } from "zustand"
import type { Arch } from "@/lib/data/architectures.type"
import { useDbStore } from "@/stores/db"

export type SelectionSource = "sidebar" | "marker" | "url"

type ArchDetailState = {
  selected: Arch | null
  loading: boolean
  selectionSource: SelectionSource | null
  select: (slug: string, source: SelectionSource) => Promise<Arch | null>
  deselect: () => void
}

export const useArchDetailStore = create<ArchDetailState>((set, get) => ({
  selected: null,
  loading: false,
  selectionSource: null,

  select: async (slug: string, source: SelectionSource) => {
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
        selectionSource: source,
      })
    } else {
      set({ loading: false })
    }
    return arch
  },

  deselect: () => {
    set({ selected: null, loading: false, selectionSource: null })
  },
}))
