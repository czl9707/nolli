import { forwardRef, useCallback, useMemo, useRef, type ReactNode } from "react"
import { getMapStyle, Map, useMapPatterns, type MapRef } from "@nolli/map"

// Bare map for the spine — no arch markers of its own; scenes portal
// their marker sets in (photo-markers / index-markers). The wrapper stands
// pointer events down (no drag); marker css re-enables its own.
export const LandingMap = forwardRef<
  MapRef,
  { children?: ReactNode }
>(function LandingMap({ children }, ref) {
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
      // the map is cinematic, not interactive — markers re-enable pointer
      // events on themselves, and gestures inside one must not move the map
      m.dragPan.disable()
      m.doubleClickZoom.disable()
      // Forward the maplibre instance to the consumer's ref.
      if (typeof ref === "function") ref(m)
      else if (ref) ref.current = m
      initialize(m)
    },
    [initialize, ref]
  )
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <Map 
        ref={handleRef}
        styles={mapStyles} 
        loading={!patternReady}>
        {children}
      </Map>
    </div>
  )
})
