import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { useDbStore } from "@nolli/data"
import type { DataSource, ArchSummary } from "@nolli/data"

type SelectionState = {
  /** Slugs of buildings the user has pinned onto the map. */
  selected: Set<string>
  /** Summaries for the currently selected slugs, keyed by slug. Re-resolved
   *  (one `getArchSummariesBySlugs` round-trip) whenever the selection changes,
   *  so a pinned building resolves even when the viewport or filter excludes
   *  it. Empty until the first fetch lands. */
  summaries: Record<string, ArchSummary>
  toggle: (slug: string) => void
  isSelected: (slug: string) => boolean
  /** Replace the entire selection (used to hydrate from the URL). */
  setAll: (slugs: Set<string>) => void
  clear: () => void
}

export const useSelectionStore = create(
  subscribeWithSelector<SelectionState>((set, get) => ({
    selected: new Set(),
    summaries: {},

    toggle: (slug) =>
      set((s) => {
        const next = new Set(s.selected)
        if (next.has(slug)) next.delete(slug)
        else next.add(slug)
        return { selected: next }
      }),
    isSelected: (slug) => get().selected.has(slug),
    setAll: (slugs) => set({ selected: new Set(slugs) }),
    clear: () => set({ selected: new Set() }),
  })),
)

/**
 * Resolve summaries for whatever the current selection is. Mirrors the filter
 * store: once a `DataSource` lands, subscribe to `selected` and fetch its
 * summaries, plus an initial fetch in case a selection was hydrated from the
 * URL before this sync attached (the app gates selection hydration on the db
 * being ready, but the initial fetch keeps this self-contained).
 */
function startSelectionSync(dataSource: DataSource) {
  const resolve = (slugs: Set<string>) => {
    if (slugs.size === 0) {
      useSelectionStore.setState({ summaries: {} })
      return
    }
    dataSource
      .getArchSummariesBySlugs([...slugs])
      .then((rows) => {
        const summaries: Record<string, ArchSummary> = {}
        for (const r of rows) summaries[r.slug] = r
        useSelectionStore.setState({ summaries })
      })
      .catch(() => {
        useSelectionStore.setState({ summaries: {} })
      })
  }

  useSelectionStore.subscribe(
    (state) => state.selected,
    (selected) => resolve(selected),
  )

  resolve(useSelectionStore.getState().selected)
}

let prevDataSource: DataSource | null = null
useDbStore.subscribe((state) => {
  if (state.dataSource && !prevDataSource) {
    startSelectionSync(state.dataSource)
  }
  prevDataSource = state.dataSource
})
