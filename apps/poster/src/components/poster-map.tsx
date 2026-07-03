import { useCallback } from "react"
import { ArchMap } from "@nolli/map"
import type { MapRef } from "@nolli/map"
import { useUiStore } from "@/stores/ui"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useSelectionStore } from "@/stores/selection"
import { PhotoMarkers } from "./photo-markers"
import type { PosterBuilding } from "@/types"
import styles from "./poster-map.module.css"

/**
 * Figure-ground map for the poster. Delegates the MapLibre setup, the clustered
 * plain-marker layer (with split/merge animations), and the controls to the
 * shared <ArchMap>. The poster contributes only its photo overlay (children)
 * and forwards <ArchMap>'s map instance into the shared store so the sidebar's
 * viewport filter can read map bounds.
 *
 * `capture` is always on so the WebGL canvas can be read back into a PNG
 * (preserveDrawingBuffer); the perf cost is poster-only — nolli doesn't pay it.
 *
 * Preview mode framing differs by route: overview hides everything for a clean
 * tiles-only frame; spotlight hides only the controls so the marker (and the
 * hero photo tied to it) stay visible. The map is always "ready" here because
 * App early-returns while the snapshot is loading.
 */
export function PosterMap({
  buildings,
  spotlight,
}: {
  buildings: PosterBuilding[]
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

  // Clicking a marker mirrors the sidebar card for the active route: overview
  // toggles the pin (multi-select), spotlight makes it the single spotlighted
  // building (which the framing hook then flies to).
  const handleArchClick = useCallback(
    (slug: string) => {
      if (spotlight) setAll(new Set([slug]))
      else toggle(slug)
    },
    [spotlight, setAll, toggle]
  )

  const handleRef = useCallback(
    (m: MapRef | null) => {
      // <ArchMap> owns pattern init internally; the poster only needs the
      // instance for the sidebar's bounds filter.
      if (!m) return
      setMapInstance(m)
    },
    [setMapInstance]
  )

  return (
    <div className={styles.container}>
      <ArchMap
        ref={handleRef}
        architectures={hideMarkers ? [] : buildings}
        selectedSlug={selectedSlug}
        onArchClick={handleArchClick}
        capture
        ready
        showControls={!previewMode}
      >
        {!spotlight && <PhotoMarkers buildings={buildings} />}
      </ArchMap>
    </div>
  )
}
