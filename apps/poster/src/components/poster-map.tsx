import { useCallback, useEffect, useMemo, useRef } from "react"
import { Map, getMapStyle, useMapPatterns } from "@nolli/map"
import type { MapRef } from "@nolli/map"
import { useThemeStore } from "@nolli/ui"
import styles from "./poster-map.module.css"

export function PosterMap() {
  const mapRef = useRef<MapRef | null>(null)
  const { ready: patternReady, initialize } = useMapPatterns(mapRef)

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
      initialize(ref)
    },
    [initialize]
  )

  return (
    <div className={styles.container}>
      <Map ref={handleRef} styles={mapStyles} loading={!patternReady} />
    </div>
  )
}
