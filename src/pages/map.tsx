import { Map, MapControls } from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Theme } from "@/lib/map-texture/constant"

const PATTERNS = [
  { pattern: "water", id: "water-pattern" },
  { pattern: "grass", id: "grass-pattern" },
  { pattern: "forest", id: "forest-pattern" },
  { pattern: "building", id: "building-pattern" },
  { pattern: "landuse", id: "landuse-pattern" },
]

type CachedImage = HTMLImageElement | ImageBitmap

function patternUrl(pattern: string, theme: Theme) {
  return `/patterns/${theme}/${pattern}.png`
}

function applyImage(map: MapRef, id: string, data: CachedImage) {
  if (map.hasImage(id)) map.removeImage(id)
  map.addImage(id, data, { pixelRatio: 2 })
}

async function fetchAndCache(
  map: MapRef,
  theme: Theme,
  cache: Record<string, CachedImage>,
  apply: boolean,
) {
  await Promise.all(
    PATTERNS.map(async ({ pattern, id }) => {
      const key = `${theme}:${pattern}`
      let data = cache[key]
      if (!data) {
        const res = await map.loadImage(patternUrl(pattern, theme))
        data = res.data
        cache[key] = data
      }
      if (apply) applyImage(map, id, data)
    }),
  )
}

export function MapPage() {
  const mapRef = useRef<MapRef | null>(null)
  const cacheRef = useRef<Record<string, CachedImage>>({})
  const [ready, setReady] = useState(false)

  const mapStyles = useMemo(() => ({
    light: getMapStyle("light"),
    dark: getMapStyle("dark"),
  }), [])

  const applyAllPatterns = useCallback((map: MapRef, theme: Theme) => {
    for (const { pattern, id } of PATTERNS) {
      const data = cacheRef.current[`${theme}:${pattern}`]
      if (data) applyImage(map, id, data)
    }
  }, [])

  const handleRef = useCallback((map: MapRef | null) => {
    if (!map) return
    mapRef.current = map

    const current: Theme = document.documentElement.classList.contains("dark") ? "dark" : "light"
    const other: Theme = current === "dark" ? "light" : "dark"

    map.on("style.load", () => {
      const theme: Theme = document.documentElement.classList.contains("dark") ? "dark" : "light"
      applyAllPatterns(map, theme)
    })

    fetchAndCache(map, current, cacheRef.current, true).then(() => {
      if (mapRef.current !== map) return
      setReady(true)
      fetchAndCache(map, other, cacheRef.current, false)
    })
  }, [applyAllPatterns])

  useEffect(() => {
    let prevDark = document.documentElement.classList.contains("dark")
    const observer = new MutationObserver(async () => {
      const map = mapRef.current
      if (!map) return
      const dark = document.documentElement.classList.contains("dark")
      if (dark === prevDark) return
      prevDark = dark
      const theme: Theme = dark ? "dark" : "light"
      applyAllPatterns(map, theme)
      await fetchAndCache(map, theme, cacheRef.current, true)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full h-full">
      <Map ref={handleRef} styles={mapStyles} loading={!ready}>
        <MapControls className="right-2 bottom-16" showZoom showCompass showLocate />
      </Map>
    </div>
  )
}
