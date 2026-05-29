import {
  archSummarySchema,
  archSchema,
  type ArchSummary,
  type Arch,
  type BBox,
} from "./types"
import { supabase } from "@/lib/data/supabase-client"

export type { Arch, ArchSummary, ArchPhoto, ArchNote, ArchLinks, Coordinates, BBox } from "./types"

const summaryCache = new Map<string, ArchSummary>()
const detailCache = new Map<string, Arch>()

function parseSummaryRow(row: Record<string, unknown>): ArchSummary {
  return archSummarySchema.parse({
    slug: row.slug,
    name: row.name,
    architect: (Array.isArray(row.architect) ? (row.architect as { name: string }[])[0]?.name : (row.architect as { name: string })?.name) ?? "",
    year: row.year,
    coordinates: { lng: row.longitude, lat: row.latitude },
    coverImage: (row.cover as { image: string }[])?.[0]?.image ?? null,
  })
}

function parseDetailRow(row: Record<string, unknown>): Arch {
  type PhotoRow = { image: string; caption: string | null; width: number; height: number; is_cover: boolean }
  type LinkRow = { type: string; url: string; label: string }
  type NoteRow = { text: string }

  const photos = (row.photos as PhotoRow[]) ?? []
  const coverPhoto = photos.find((p) => p.is_cover)

  const links: Record<string, unknown> = {
    googleMaps: row.google_maps_url,
    custom: [],
  }
  for (const link of (row.links as LinkRow[]) ?? []) {
    if (link.type === "wikipedia" || link.type === "archdaily") {
      links[link.type] = link.url
    } else if (link.type === "custom") {
      ;(links.custom as { url: string; label: string }[]).push({ url: link.url, label: link.label })
    }
  }
  if ((links.custom as unknown[]).length === 0) delete links.custom

  return archSchema.parse({
    slug: row.slug,
    name: row.name,
    architect: (Array.isArray(row.architect) ? (row.architect as { name: string }[])[0]?.name : (row.architect as { name: string })?.name) ?? "",
    year: row.year,
    coordinates: { lng: row.longitude, lat: row.latitude },
    coverImage: coverPhoto?.image ?? null,
    address: row.address,
    photos: photos
      .map((p) => ({ image: p.image, caption: p.caption ?? undefined, width: p.width, height: p.height })),
    notes: ((row.notes as NoteRow[]) ?? []).map((n) => ({ text: n.text })),
    links,
  })
}

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

  const results = data.map(parseSummaryRow)
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

  const arch = parseDetailRow(data)
  detailCache.set(slug, arch)
  return arch
}
