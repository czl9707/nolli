import { useCallback } from "react"
import { ArchMap, MapControls } from "@nolli/map"
import type { MapRef } from "@nolli/map"
import { useUiStore } from "@/stores/ui"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useSelectionStore } from "@/stores/selection"
import { PhotoMarkers } from "../overview/photo-markers"
import type { ArchSummary } from "@nolli/data"
import styles from "./poster-map.module.css"


export function PosterMap({
  architectures,
  spotlight,
}: {
  architectures: ArchSummary[]
  spotlight: boolean
}) {
  const previewMode = useUiStore((s) => s.previewMode)
  const setMapInstance = useMapInstanceStore((s) => s.setMap)
  const toggle = useSelectionStore((s) => s.toggle)
  const setAll = useSelectionStore((s) => s.setAll)
  // The single selected building's slug — passed through to <ArchMap> so its
  // plain pin renders in the shared `data-selected` (larger) state. Applies in
  // both modes: in overview the same building also gets a photo card, in
  // spotlight the hero overlay floats off the map and this pin is the only
  // marker, so highlighting it ties the photo to its location.
  const selectedSlug = useSelectionStore((s) =>
    s.selected.size === 0 ? undefined : Array.from(s.selected)[0]
  )
  // Overview preview = tiles only; spotlight preview keeps the marker.
  const hideMarkers = previewMode && !spotlight

  // Clicking a marker mirrors the sidebar card for the active route.
  const handleArchClick = useCallback(
    (slug: string) => {
      if (spotlight) setAll(new Set([slug]))
      else toggle(slug)
    },
    [spotlight, setAll, toggle]
  )

  const handleRef = useCallback(
    (m: MapRef | null) => {
      if (!m) return
      setMapInstance(m)
    },
    [setMapInstance]
  )

  return (
    <div className={styles.container}>
      <ArchMap
        ref={handleRef}
        architectures={hideMarkers ? [] : architectures}
        selectedSlug={selectedSlug}
        onArchClick={handleArchClick}
        capture
        ready
      >
        {!previewMode && <MapControls showZoom showLocate showFullscreen />}
        {!spotlight && <PhotoMarkers />}
      </ArchMap>
    </div>
  )
}
