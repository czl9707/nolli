import { useEffect } from "react"
import { useSelectionStore } from "@/stores/selection"
import { parseMapParams, setParams } from "@/lib/url-state"

/**
 * Keeps the pinned-building selection two-way in sync with the URL `selection`
 * query param.
 * - store → URL: any selection change is serialized via `setParams`.
 * - URL → store: on first mount and on `popstate` (back/forward), re-parse and
 *   `setAll`.
 */
export function useSelectionUrlSync() {
  // Hydrate from the URL on first mount.
  useEffect(() => {
    const { selection } = parseMapParams(window.location.search)
    if (selection.size > 0) {
      useSelectionStore.getState().setAll(selection)
    }
  }, [])

  // Re-hydrate on back/forward.
  useEffect(() => {
    const onPop = () => {
      const { selection } = parseMapParams(window.location.search)
      useSelectionStore.getState().setAll(selection)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Write selection → URL on change.
  const selected = useSelectionStore((s) => s.selected)
  useEffect(() => {
    setParams({ selection: selected })
  }, [selected])
}
