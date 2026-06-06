import { create } from "zustand"
import type { Arch } from "@/lib/data/architectures.type"
import type { DataSource } from "@/lib/data/data-source.type"

type ArchDetailState = {
  selected: Arch | null
  loading: boolean
  select: (slug: string, dataSource: DataSource) => Promise<Arch | null>
  deselect: () => void
}

export const useArchDetailStore = create<ArchDetailState>((set, get) => ({
  selected: null,
  loading: false,

  select: async (slug: string, dataSource: DataSource) => {
    const current = get().selected
    if (current?.slug === slug) return current
    set({ loading: true })
    const arch = await dataSource.getArchBySlug(slug)
    if (arch) {
      set({
        selected: arch,
        loading: false,
      })
    } else {
      set({ loading: false })
    }
    return arch
  },

  deselect: () => {
    set({ selected: null, loading: false })
  },
}))
