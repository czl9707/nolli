import { mapToArchSummary, mapToArch } from "./data-mappers"
import type { ArchSummary, Arch, BBox } from "./types"

export type { Arch, ArchSummary, ArchPhoto, ArchNote, ArchLinks, Coordinates, BBox } from "./types"

import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

const summaryCache = new Map<string, ArchSummary>()
const detailCache = new Map<string, Arch>()

export async function getAllArchitectures(bbox?: BBox): Promise<ArchSummary[]> {
  if (summaryCache.size > 0) {
    let results = Array.from(summaryCache.values())
    if (bbox) {
      results = results.filter(
        (a) =>
          a.coordinates.lat >= bbox.south &&
          a.coordinates.lat <= bbox.north &&
          a.coordinates.lng >= bbox.west &&
          a.coordinates.lng <= bbox.east
      )
    }
    return results
  }

  let query = supabase
    .from("architectures")
    .select(`
      slug, name, year, latitude, longitude,
      architect:architects(name),
      cover:architecture_photos!inner(image)
    `)
    .eq("architecture_photos.is_cover", true)
    .order("name")

  if (bbox) {
    query = query
      .gte("latitude", bbox.south)
      .lte("latitude", bbox.north)
      .gte("longitude", bbox.west)
      .lte("longitude", bbox.east)
  }

  const { data, error } = await query
  if (error) throw error
  if (!data) return []

  const results = data.map(mapToArchSummary)
  for (const arch of results) {
    summaryCache.set(arch.slug, arch)
  }
  return results
}

export async function getArchBySlug(slug: string): Promise<Arch | null> {
  const cached = detailCache.get(slug)
  if (cached) return cached

  const { data, error } = await supabase
    .from("architectures")
    .select(`
      slug, name, year, address, latitude, longitude,
      google_maps_url,
      architect:architects(name),
      photos:architecture_photos(id, image, caption, width, height, is_cover),
      notes:architecture_notes(id, text),
      links:architecture_links(id, type, url, label, sort_order)
    `)
    .eq("slug", slug)
    .single()

  if (error || !data) return null

  const arch = mapToArch(data)
  detailCache.set(slug, arch)
  return arch
}
