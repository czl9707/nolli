import type MapLibreGL from "maplibre-gl"
import type { Theme } from "./constant"

type CachedImage = HTMLImageElement | ImageBitmap

const MAP_PATTERNS = [
  { pattern: "water", id: "water-pattern" },
  { pattern: "grass", id: "grass-pattern" },
  { pattern: "forest", id: "forest-pattern" },
  { pattern: "building", id: "building-pattern" },
  { pattern: "landuse", id: "landuse-pattern" },
]

function patternUrl(pattern: string, theme: Theme): string {
  return `/patterns/${theme}/${pattern}.png`
}

function applyImage(map: MapLibreGL.Map, id: string, data: CachedImage): void {
  if (map.hasImage(id)) map.removeImage(id)
  map.addImage(id, data, { pixelRatio: 2 })
}

async function fetchAndCache(
  map: MapLibreGL.Map,
  theme: Theme,
  cache: Record<string, CachedImage>,
  apply: boolean,
): Promise<void> {
  await Promise.all(
    MAP_PATTERNS.map(async ({ pattern, id }) => {
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

function applyAllPatterns(
  map: MapLibreGL.Map,
  theme: Theme,
  cache: Record<string, CachedImage>,
): void {
  for (const { pattern, id } of MAP_PATTERNS) {
    const data = cache[`${theme}:${pattern}`]
    if (data) applyImage(map, id, data)
  }
}

export { fetchAndCache, applyAllPatterns }
export type { CachedImage }
