import { useCallback, useEffect, useRef, useState } from "react"
import type MapLibreGL from "maplibre-gl"
import type { Theme } from "@/lib/map-texture/constant"
import { fetchAndCache, applyAllPatterns } from "@/lib/map-texture/map-patterns"
import type { CachedImage } from "@/lib/map-texture/map-patterns"

function getTheme(): Theme {
  return document.body.dataset.theme === "dark" ? "dark" : "light"
}

function useMapPatterns(mapRef: React.RefObject<MapLibreGL.Map | null>) {
  const cacheRef = useRef<Record<string, CachedImage>>({})
  const [ready, setReady] = useState(false)

  const initialize = useCallback(
    (map: MapLibreGL.Map) => {
      const current = getTheme()
      const other: Theme = current === "dark" ? "light" : "dark"

      map.on("style.load", () => {
        applyAllPatterns(map, getTheme(), cacheRef.current)
      })

      fetchAndCache(map, current, cacheRef.current, true).then(() => {
        if (mapRef.current !== map) return
        setReady(true)
        fetchAndCache(map, other, cacheRef.current, false)
      })
    },
    [mapRef],
  )

  useEffect(() => {
    let preTheme = getTheme();
    const observer = new MutationObserver(async () => {
      const map = mapRef.current
      if (!map) return

      if (preTheme === getTheme()) return
      preTheme = getTheme();
      applyAllPatterns(map, preTheme, cacheRef.current)
      await fetchAndCache(map, preTheme, cacheRef.current, true)
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })
    return () => observer.disconnect()
  }, [mapRef])

  return { ready, initialize }
}

export { useMapPatterns }
