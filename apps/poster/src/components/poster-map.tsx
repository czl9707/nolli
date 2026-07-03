import { useCallback } from "react"
import { ArchMap } from "@nolli/map"
import type { MapRef } from "@nolli/map"
import { useUiStore } from "@/stores/ui"
import { useMapInstanceStore } from "@/stores/map-instance"
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
 * Capture mode passes an empty architectures array so <ArchMap> renders no
 * plain markers — leaving a clean map + photos frame. The map is always
 * "ready" here because App early-returns while the snapshot is loading.
 */
export function PosterMap({
  buildings,
  spotlight,
}: {
  buildings: PosterBuilding[]
  spotlight: boolean
}) {
  const captureMode = useUiStore((s) => s.captureMode)
  const setMapInstance = useMapInstanceStore((s) => s.setMap)

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
        architectures={captureMode ? [] : buildings}
        ready
        showControls={!captureMode}
      >
        {!spotlight && <PhotoMarkers buildings={buildings} />}
      </ArchMap>
    </div>
  )
}
