import { create } from "zustand"
import type { Arch } from "@nolli/data"
import { useDbStore } from "@/stores/db"

// Pure data store: loads an Arch and holds selection + fly-to intent. It never
// touches the URL — navigation is a view concern handled at the call sites
// (ArchCard, the map marker) and reconciled back here by <ArchSync/>.
type ArchDetailState = {
  selected: Arch | null
  loading: boolean
  shouldFlyTo: boolean
  /** Loads the Arch and sets selection + fly intent. Does not navigate. */
  select: (slug: string, shouldFlyTo: boolean) => Promise<Arch | null>
  /** Clears selection. Does not navigate. */
  deselect: () => void
}

export const useArchDetailStore = create<ArchDetailState>((set, get) => ({
  selected: null,
  loading: false,
  shouldFlyTo: false,

  select: async (slug: string, shouldFlyTo: boolean) => {
    const current = get().selected
    if (current?.slug === slug) return current

    while (useDbStore.getState().loading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    const dataSource = useDbStore.getState().dataSource
    if (dataSource == null) return null
    set({ loading: true })
    const arch = await dataSource.getArchBySlug(slug)
    if (arch) {
      set({ selected: arch, loading: false, shouldFlyTo })
    } else {
      set({ loading: false })
    }
    return arch
  },

  deselect: () => {
    set({ selected: null, loading: false, shouldFlyTo: false })
  },
}))
