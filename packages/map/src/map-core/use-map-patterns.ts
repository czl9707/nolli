import { useCallback, useEffect, useRef, useState } from "react"
import type MapLibreGL from "maplibre-gl"
import { useThemeStore, type ResolvedTheme } from "@nolli/ui"
import { fetchAndCache, applyAllPatterns } from "../map-texture/map-patterns"
import type { CachedImage } from "../map-texture/map-patterns"

function useMapPatterns(mapRef: React.RefObject<MapLibreGL.Map | null>) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const prevThemeRef = useRef(resolvedTheme)
  const cacheRef = useRef<Record<string, CachedImage>>({})
  const [ready, setReady] = useState(false)

  const initialize = useCallback(
    (map: MapLibreGL.Map) => {
      const current: ResolvedTheme = resolvedTheme
      const other: ResolvedTheme = current === "dark" ? "light" : "dark"

      map.on("style.load", () => {
        applyAllPatterns(map, resolvedTheme, cacheRef.current)
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
    applyAllPatterns(map, resolvedTheme, cacheRef.current)
    fetchAndCache(map, resolvedTheme, cacheRef.current, true)
  }, [resolvedTheme, mapRef])

  return { ready, initialize }
}

export { useMapPatterns }
