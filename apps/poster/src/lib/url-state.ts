export type LngLat = [number, number]

export type MapParams = {
  center?: LngLat
  zoom?: number
  selection: Set<string>
}

export function parseMapParams(search: string): MapParams {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  )

  const center = parseCenter(params.get("center"))
  const zoom = parseZoom(params.get("zoom"))
  const selection = parseSelection(params.get("selection"))

  return { center, zoom, selection }
}

function parseCenter(raw: string | null): LngLat | undefined {
  if (!raw) return undefined
  const [lngStr, latStr] = raw.split(",")
  const lng = Number(lngStr)
  const lat = Number(latStr)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined
  return [lng, lat]
}

function parseZoom(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined
  const zoom = Number(raw)
  return Number.isFinite(zoom) ? zoom : undefined
}

function parseSelection(raw: string | null): Set<string> {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  )
}

export type MapParamState = {
  center?: LngLat
  zoom?: number
  selection: Set<string>
}

function round(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

export function serializeMapParams(state: MapParamState): string {
  const parts: string[] = []

  if (state.center) {
    const [lng, lat] = state.center
    parts.push(`center=${round(lng, 5)},${round(lat, 5)}`)
  }

  if (state.zoom !== undefined) {
    parts.push(`zoom=${round(state.zoom, 2)}`)
  }

  if (state.selection.size > 0) {
    parts.push(`selection=${Array.from(state.selection).join(",")}`)
  }

  return parts.join("&")
}
