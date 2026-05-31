import { create } from "zustand"
import type { Arch } from "@/lib/data/architectures"
import { getArchBySlug } from "@/lib/data/architectures"

type ArchState = {
  lastSelectedArch: Arch | null
  loading: boolean
  flyToTrigger: number
  selectArch: (slug: string) => Promise<Arch | null>
  deselectArch: () => void
}

export const useArchStore = create<ArchState>((set, get) => ({
  lastSelectedArch: null,
  loading: false,
  flyToTrigger: 0,

  selectArch: async (slug: string) => {
    const current = get().lastSelectedArch
    if (current?.slug === slug) return current
    set({ loading: true })
    const arch = await getArchBySlug(slug)
    if (arch) {
      set((s) => ({
        lastSelectedArch: arch,
        flyToTrigger: s.flyToTrigger + 1,
        loading: false,
      }))
    } else {
      set({ loading: false })
    }
    return arch
  },

  deselectArch: () => {
    set({ lastSelectedArch: null, loading: false })
  },
}))
