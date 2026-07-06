// apps/poster/src/lib/url-state.ts
import {
  EDGES,
  CORNERS,
  DEFAULT_CAPTION,
  type Edge,
  type Corner,
} from "./caption-types"

export type LngLat = [number, number]

export type MapParamState = {
  center?: LngLat
  zoom?: number
  selection: Set<string>
  captionEdge: Edge
  captionCorner: Corner
  primarySize: number
  secondarySize: number
}

// --- leaf parsers / serializers -------------------------------------------

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

function serializeCenter(c: LngLat | undefined): string | undefined {
  if (!c) return undefined
  return `${round(c[0], 5)},${round(c[1], 5)}`
}

function parseZoom(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined
  const zoom = Number(raw)
  return Number.isFinite(zoom) ? zoom : undefined
}

function serializeZoom(z: number | undefined): string | undefined {
  return z === undefined ? undefined : String(round(z, 2))
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

function serializeSelection(s: Set<string>): string | undefined {
  return s.size === 0 ? "" : Array.from(s).join(",")
}

/** Returns `def` when `raw` is not one of `values`. */
function parseEnum<T extends string>(values: readonly T[]) {
  return (raw: string | null, def: T): T =>
    raw !== null && (values as readonly string[]).includes(raw) ? (raw as T) : def
}

/** Integer clamp into [min,max]; non-numeric → def. */
function parseIntClamped(min: number, max: number) {
  return (raw: string | null, def: number): number => {
    if (raw === null || raw === "") return def
    const n = Math.round(Number(raw))
    if (!Number.isFinite(n)) return def
    return Math.min(max, Math.max(min, n))
  }
}

// --- schema ----------------------------------------------------------------

type Spec<T> = {
  key: string
  parse: (raw: string | null, def: T) => T
  serialize: (value: T) => string | undefined
  default: T
}

const parseEdge = parseEnum(EDGES)
const parseCorner = parseEnum(CORNERS)
const parseSize = parseIntClamped(8, 120)

const SPECS: {
  [K in keyof MapParamState]: Spec<MapParamState[K]>
} = {
  center: { key: "center", parse: parseCenter, serialize: serializeCenter, default: undefined },
  zoom: { key: "zoom", parse: parseZoom, serialize: serializeZoom, default: undefined },
  selection: { key: "selection", parse: parseSelection, serialize: serializeSelection, default: new Set<string>() },
  captionEdge: { key: "edge", parse: parseEdge, serialize: String, default: DEFAULT_CAPTION.captionEdge },
  captionCorner: { key: "corner", parse: parseCorner, serialize: String, default: DEFAULT_CAPTION.captionCorner },
  primarySize: { key: "primary", parse: parseSize, serialize: String, default: DEFAULT_CAPTION.primarySize },
  secondarySize: { key: "secondary", parse: parseSize, serialize: String, default: DEFAULT_CAPTION.secondarySize },
}

// --- parse -----------------------------------------------------------------

export function parseMapParams(search: string): MapParamState {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  )
  const out = {} as MapParamState
  for (const k in SPECS) {
    const spec = SPECS[k as keyof MapParamState]!
    const parse = spec.parse as (raw: string | null, def: never) => unknown
    ;(out as Record<string, unknown>)[k] = parse(params.get(spec.key), spec.default as never)
  }
  return out
}

// --- write -----------------------------------------------------------------

export function round(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/**
 * Serialize a typed partial update into a key→string map. Values that are
 * `undefined` OR equal to their spec default map to `undefined`, which
 * `mergedQuery` deletes — so URLs stay clean and resetting a setting to its
 * default removes the param. Pure (no DOM).
 */
export function serializeParams(
  updates: Partial<MapParamState>
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const k in updates) {
    const spec = SPECS[k as keyof MapParamState]!
    const value = updates[k as keyof MapParamState]
    if (value === undefined || value === spec.default) {
      out[spec.key] = undefined
    } else {
      out[spec.key] = spec.serialize(value as never)
    }
  }
  return out
}

/** Pure core: merge a serialized key→value map into a search string. */
export function mergedQuery(
  currentSearch: string,
  updates: Record<string, string | undefined>
): string {
  const params = new URLSearchParams(currentSearch)
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") params.delete(key)
    else params.set(key, value)
  }
  // URLSearchParams encodes "," as %2C; we use bare commas in center/selection,
  // so decode them back for readable URLs. parseMapParams tolerates either form.
  const search = params.toString().replace(/%2C/g, ",")
  return search ? `?${search}` : ""
}

/**
 * Merge partial typed updates into the current URL via `history.replaceState`,
 * preserving untouched keys and the current pathname. Thin DOM wrapper over
 * `mergedQuery` + `serializeParams` (which are unit-tested directly).
 */
export function setParams(updates: Partial<MapParamState>) {
  const next = mergedQuery(window.location.search, serializeParams(updates))
  window.history.replaceState(null, "", `${window.location.pathname}${next}`)
}
