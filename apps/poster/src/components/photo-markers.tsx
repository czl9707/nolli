import { useSelectionStore } from "@/stores/selection"
import type { PosterBuilding } from "@/types"
import { PhotoMarker } from "./photo-marker"

export function PhotoMarkers({ buildings }: { buildings: PosterBuilding[] }) {
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
