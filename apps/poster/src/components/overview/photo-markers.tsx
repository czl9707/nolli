import { useSelectionStore } from "@/stores/selection"
import type { ArchSummary } from "@nolli/data"
import { PhotoMarker } from "./photo-marker"

export function PhotoMarkers({ buildings }: { buildings: ArchSummary[] }) {
  const selected = useSelectionStore((s) => s.selected)

  const chosen = buildings.filter((b) => selected.has(b.slug))
  return (
    <>
      {chosen.map((b) => (
        <PhotoMarker key={b.slug} building={b} />
      ))}
    </>
  )
}
