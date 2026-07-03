import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import { Map, MapControls } from "../map-core/map"
import type { MapRef } from "../map-core/map"
import { getMapStyle } from "../map-style"
import { useMapPatterns } from "../map-core/use-map-patterns"
import type { ArchSummary } from "@nolli/data"
import { ArchMarkers } from "./markers"
import styles from "./arch-map.module.css"

export type ArchMapProps = {
  /** Architectures to render as clustered markers. Empty array → no markers. */
  architectures: ArchSummary[]
  /** Slug of the building whose marker should be highlighted. */
  selectedSlug?: string
  /** Called when an individual marker is clicked. Omit for non-interactive markers. */
  onArchClick?: (slug: string) => void
  /** Whether the underlying data is loaded. Drives the loading overlay. */
  ready: boolean
  /** Show zoom/locate/fullscreen controls. Default true. */
  showControls?: boolean
  /**
   * Opt into client-side screenshot capture (e.g. html-to-image). Sets
   * MapLibre's `preserveDrawingBuffer: true` so the WebGL canvas can be read
   * back into an image; otherwise the captured map tiles are blank. Off by
   * default — it disables a GPU compositing optimization, so only the app that
   * actually screenshots (poster) should enable it.
   */
  capture?: boolean
  /** Extra content rendered inside <Map> (after the marker layer) — e.g. overlays. */
  children?: ReactNode
}

/**
 * Shared figure-ground map for architecture data. Owns the MapLibre setup,
 * the clustered marker layer with split/merge animations, and the controls.
 * Layout-agnostic: fills its container. The consumer drives fly-to, layout
 * morph, and error handling via props/children.
 *
 * Theme is NOT set here — the consumer's theme store decides light/dark
 * (inherited via <Map>, which reads useThemeStore).
 */
export const ArchMap = forwardRef<MapRef, ArchMapProps>(function ArchMap(
  {
    architectures,
    selectedSlug,
    onArchClick,
    ready,
    showControls = true,
    capture = false,
    children,
  },
  ref
) {
  const mapRef = useRef<MapRef | null>(null)
  const { ready: patternReady, initialize } = useMapPatterns(mapRef)

  const mapStyles = useMemo(
    () => ({ light: getMapStyle("light"), dark: getMapStyle("dark") }),
    []
  )

  const handleRef = useCallback(
    (m: MapRef | null) => {
      if (!m) return
      mapRef.current = m
      // Forward the maplibre instance to the consumer's ref.
      if (typeof ref === "function") ref(m)
      else if (ref) ref.current = m
      initialize(m)
    },
    [initialize, ref]
  )

  const isLoading = !patternReady || !ready

  return (
    <div className={styles.container}>
      <Map
        ref={handleRef}
        styles={mapStyles}
        loading={isLoading}
        canvasContextAttributes={capture ? { preserveDrawingBuffer: true } : undefined}
      >
        {showControls && <MapControls showZoom showLocate showFullscreen />}
        <ArchMarkers
          architectures={architectures}
          selectedSlug={selectedSlug}
          onArchClick={onArchClick}
        />
        {children}
      </Map>
    </div>
  )
})
