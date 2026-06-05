import { create } from "zustand"
import type { Arch } from "@/lib/data/architectures.type"
import type { DataSource } from "@/lib/data/data-source.type"

type ArchDetailState = {
  selectedArch: Arch | null
  loading: boolean
  selectArch: (slug: string, dataSource: DataSource) => Promise<Arch | null>
  deselectArch: () => void
}

export const useArchDetailStore = create<ArchDetailState>((set, get) => ({
  selectedArch: null,
  loading: false,

  selectArch: async (slug: string, dataSource: DataSource) => {
    const current = get().selectedArch
    if (current?.slug === slug) return current
    set({ loading: true })
    const arch = await dataSource.getArchBySlug(slug)
    if (arch) {
      set({
        selectedArch: arch,
        loading: false,
      })
    } else {
      set({ loading: false })
    }
    return arch
  },

  deselectArch: () => {
    set({ selectedArch: null, loading: false })
  },
}))
