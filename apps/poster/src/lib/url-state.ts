export type LngLat = [number, number]

export type Side = "left" | "right" | "top" | "bottom"

const DEFAULT_SIDE: Side = "right"
const SIDES: Side[] = ["left", "right", "top", "bottom"]

export type MapParamState = {
  center?: LngLat
  zoom?: number
  selection: Set<string>
  side?: Side
}

export function parseMapParams(search: string): MapParamState {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  )

  const center = parseCenter(params.get("center"))
  const zoom = parseZoom(params.get("zoom"))
  const selection = parseSelection(params.get("selection"))
  const side = parseSide(params.get("side"))

  return { center, zoom, selection, side }
}

/** Web-Mercator latitude limit; longitudes wrap, so clamp to ±180. */
const LNG_MAX = 180
const LAT_MAX = 85.06

function parseCenter(raw: string | null): LngLat | undefined {
  if (!raw) return undefined
  const [lngStr, latStr] = raw.split(",")
  const lng = Number(lngStr)
  const lat = Number(latStr)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined
  if (lng < -LNG_MAX || lng > LNG_MAX || lat < -LAT_MAX || lat > LAT_MAX) {
    return undefined
  }
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

function parseSide(raw: string | null): Side | undefined {
  if (!raw) return undefined
  return SIDES.includes(raw as Side) ? (raw as Side) : undefined
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

  if (state.side && state.side !== DEFAULT_SIDE) {
    parts.push(`side=${state.side}`)
  }

  return parts.join("&")
}
