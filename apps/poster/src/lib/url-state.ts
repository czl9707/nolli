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
