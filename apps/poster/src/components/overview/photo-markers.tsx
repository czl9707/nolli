import { useSelectionStore } from "@/stores/selection"
import type { ArchSummary } from "@nolli/data"
import { PhotoMarker } from "./photo-marker"

/**
 * Photo cards for every pinned (selected) building. The summaries are resolved
 * by the selection store — independent of the viewport/filter display set — so
 * a pinned photo persists even when the user pans or filters away from its
 * location. (Pinning is an explicit selection; the plain map pins still respect
 * filter + viewport.)
 */
export function PhotoMarkers() {
  const summaries = useSelectionStore((s) => s.summaries)
  const buildings: ArchSummary[] = Object.values(summaries)

  return (
    <>
      {buildings.map((b) => (
        <PhotoMarker key={b.slug} building={b} />
      ))}
    </>
  )
}
