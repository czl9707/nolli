"use client"

import { Map, MapControls } from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useRef } from "react"

const WATER_PATTERN_ID = "water-pattern"
const GRASS_PATTERN_ID = "grass-pattern"
const FOREST_PATTERN_ID = "forest-pattern"

function patternUrl(pattern: string, dark: boolean) {
  return `/api/pattern/${dark ? 'dark' : 'light'}/${pattern}`
}

export default function Page() {
  const mapRefStore = useRef<MapRef | null>(null)

  const loadPattern = useCallback(async (map: MapRef, pattern: string, patternId: string) => {
    const dark = document.documentElement.classList.contains("dark")
    const image = await map.loadImage(patternUrl(pattern, dark))
    if (map.hasImage(patternId)) map.updateImage(patternId, image.data)
    else map.addImage(patternId, image.data, { pixelRatio: 2 })
  }, [])

  const handleRef = useCallback(
    (map: MapRef | null) => {
      if (!map) return
      mapRefStore.current = map
      loadPattern(map, "water", WATER_PATTERN_ID)
      loadPattern(map, "grass", GRASS_PATTERN_ID)
      loadPattern(map, "forest", FOREST_PATTERN_ID)

      const onStyleLoad = () => {
        loadPattern(map, "water", WATER_PATTERN_ID)
        loadPattern(map, "grass", GRASS_PATTERN_ID)
        loadPattern(map, "forest", FOREST_PATTERN_ID)
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
