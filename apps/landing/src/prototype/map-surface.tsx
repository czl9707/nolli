// PROTOTYPE — static map mount. One ArchMap per surface, camera jumped once
// on ready (no scroll spine here — that wiring comes later). Photo markers
// ride inside the map context; overlays (veil, plate) render above.
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { ArchMap, PhotoMarker, type MapRef, type SceneCamera } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { fitCamera } from "@/lib/camera"
import styles from "./map-surface.module.css"

/** Class applied to every photo marker this surface mounts — the cursor
 * reveal's clip driver matches on it. */
export const PHOTO_MARKER_CLASS = styles.photo

export function MapSurface({
  camera,
  picks,
  fit = false,
  onMap,
  surfaceRef,
  className,
  children,
}: {
  camera: SceneCamera
  picks: ArchSummary[]
  /** Jump to a camera fitting the (initial) picks into the surface px
   * instead of the fixed `camera` — index plates. */
  fit?: boolean
  onMap?: (map: MapRef | null) => void
  surfaceRef?: RefObject<HTMLDivElement | null>
  className?: string
  children?: ReactNode
}) {
  const localRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<MapRef | null>(null)
  const initialPicks = useRef(picks)
  const setRef = useCallback(
    (m: MapRef | null) => {
      setMap(m)
      onMap?.(m)
    },
    [onMap],
  )
  useEffect(() => {
    const el = localRef.current
    if (!map || !el) return
    // display only — no pan/zoom/rotate on any prototype map
    map.dragPan.disable()
    map.scrollZoom.disable()
    map.boxZoom.disable()
    map.dragRotate.disable()
    map.doubleClickZoom.disable()
    map.keyboard.disable()
    const target =
      fit && initialPicks.current.length
        ? fitCamera(
            initialPicks.current.map((p) => p.coordinates),
            { width: el.clientWidth, height: el.clientHeight },
          )
        : camera
    map.jumpTo({ center: target.center, zoom: target.zoom })
  }, [map, camera, fit])

  return (
    <div
      ref={(el) => {
        localRef.current = el
        if (surfaceRef) surfaceRef.current = el
      }}
      className={[styles.surface, className].filter(Boolean).join(" ")}
    >
      <ArchMap ref={setRef} architectures={[]} ready={true}>
        {map && picks.map((a) => <PhotoMarker key={a.slug} building={a} className={PHOTO_MARKER_CLASS} />)}
      </ArchMap>
      {children}
    </div>
  )
}
