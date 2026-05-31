import { useCallback, useEffect, useRef, useState } from "react"
import type MapLibreGL from "maplibre-gl"
import type { Theme } from "@/lib/map-texture/constant"
import { fetchAndCache, applyAllPatterns } from "@/lib/map-texture/map-patterns"
import type { CachedImage } from "@/lib/map-texture/map-patterns"
import { useThemeStore } from "@/stores/theme"

function useMapPatterns(mapRef: React.RefObject<MapLibreGL.Map | null>) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const prevThemeRef = useRef(resolvedTheme)
  const cacheRef = useRef<Record<string, CachedImage>>({})
  const [ready, setReady] = useState(false)

  const initialize = useCallback(
    (map: MapLibreGL.Map) => {
      const current = resolvedTheme as Theme
      const other: Theme = current === "dark" ? "light" : "dark"

      map.on("style.load", () => {
        applyAllPatterns(map, resolvedTheme as Theme, cacheRef.current)
      })

      fetchAndCache(map, current, cacheRef.current, true).then(() => {
        if (mapRef.current !== map) return
        setReady(true)
        fetchAndCache(map, other, cacheRef.current, false)
      })
    },
    [mapRef, resolvedTheme]
  )

  useEffect(() => {
    if (prevThemeRef.current === resolvedTheme) return
    prevThemeRef.current = resolvedTheme
    const map = mapRef.current
    if (!map) return
    applyAllPatterns(map, resolvedTheme as Theme, cacheRef.current)
    fetchAndCache(map, resolvedTheme as Theme, cacheRef.current, true)
  }, [resolvedTheme, mapRef])

  return { ready, initialize }
}

export { useMapPatterns }
