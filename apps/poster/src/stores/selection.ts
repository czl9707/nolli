import { create } from "zustand"

type SelectionState = {
  /** Slugs of buildings the user has pinned onto the map. */
  selected: Set<string>
  toggle: (slug: string) => void
  isSelected: (slug: string) => boolean
  clear: () => void
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selected: new Set(),
  toggle: (slug) =>
    set((s) => {
      const next = new Set(s.selected)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return { selected: next }
    }),
  isSelected: (slug) => get().selected.has(slug),
  clear: () => set({ selected: new Set() }),
}))
