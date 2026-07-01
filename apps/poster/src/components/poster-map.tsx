import { useCallback, useEffect, useMemo, useRef } from "react"
import { Map, getMapStyle, useMapPatterns } from "@nolli/map"
import type { MapRef } from "@nolli/map"
import { useThemeStore } from "@nolli/ui"
import { ArchMarkers } from "./arch-markers"
import { PhotoMarkers } from "./photo-markers"
import { useMapInstanceStore } from "@/stores/map-instance"
import type { PosterBuilding } from "@/types"
import styles from "./poster-map.module.css"

export function PosterMap({ buildings }: { buildings: PosterBuilding[] }) {
  const mapRef = useRef<MapRef | null>(null)
  const { ready: patternReady, initialize } = useMapPatterns(mapRef)
  const setMapInstance = useMapInstanceStore((s) => s.setMap)

  // Default the poster to the dark figure-ground (matches Nolli's hero look).
  const setTheme = useThemeStore((s) => s.setTheme)
  useEffect(() => {
    setTheme("dark")
  }, [setTheme])

  const mapStyles = useMemo(
    () => ({ light: getMapStyle("light"), dark: getMapStyle("dark") }),
    []
  )

  const handleRef = useCallback(
    (ref: MapRef | null) => {
      if (!ref) return
      mapRef.current = ref
      setMapInstance(ref)
      initialize(ref)
    },
    [initialize, setMapInstance]
  )

  return (
    <div className={styles.container}>
      <Map ref={handleRef} styles={mapStyles} loading={!patternReady}>
        <ArchMarkers buildings={buildings} />
        <PhotoMarkers buildings={buildings} />
      </Map>
    </div>
  )
}
