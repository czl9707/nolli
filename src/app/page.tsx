"use client"

import { Map, MapControls } from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useRef } from "react"

const WATER_PATTERN_ID = "water-pattern"

function patternUrl(pattern: string, dark: boolean) {
  return `/api/pattern/${dark ? 'dark' : 'light'}/${pattern}`
}

export default function Page() {
  const mapRefStore = useRef<MapRef | null>(null)

  const loadPattern = useCallback(async (map: MapRef, pattern: string) => {
    const dark = document.documentElement.classList.contains("dark")
    const image = await map.loadImage(patternUrl(pattern, dark))
    if (map.hasImage(WATER_PATTERN_ID)) map.updateImage(WATER_PATTERN_ID, image.data)
    else map.addImage(WATER_PATTERN_ID, image.data, { pixelRatio: 1 })
  }, [])

  const handleRef = useCallback(
    (map: MapRef | null) => {
      if (!map) return
      mapRefStore.current = map
      loadPattern(map, "water")

      const onStyleLoad = () => {
        loadPattern(map, "water")
      }

      map.on("style.load", onStyleLoad)
    },
    [loadPattern],
  )

  return (
    <div className="w-full h-full">
      <Map ref={handleRef} styles={{ light: getMapStyle("light"), dark: getMapStyle("dark") }}>
        <MapControls className="right-2 bottom-16" showZoom showCompass showLocate />
      </Map>
    </div>
  )
}
