import type {
  ArchSummary,
  Arch,
  ArchPhoto,
  ArchNote,
  ArchLinks,
} from "./types"

type SummaryRow = {
  slug: string
  name: string
  year: number
  latitude: number
  longitude: number
  architect: { name: string }[]
  cover: { image: string }[]
}

type LinkRow = {
  id: string
  type: string
  url: string
  label: string
  sort_order: number
}

type DetailRow = Omit<SummaryRow, "cover"> & {
  address: string
  google_maps_url: string
  photos: {
    id: string
    image: string
    caption: string | null
    width: number
    height: number
    is_cover: boolean
  }[]
  notes: { id: string; text: string }[]
  links: LinkRow[]
}

export function mapToArchSummary(row: SummaryRow): ArchSummary {
  return {
    slug: row.slug,
    name: row.name,
    architect: row.architect[0]?.name ?? "",
    year: row.year,
    coordinates: { lng: row.longitude, lat: row.latitude },
    coverImage: row.cover?.[0]?.image ?? null,
  }
}

export function mapToArch(row: DetailRow): Arch {
  const coverPhoto = row.photos.find((p) => p.is_cover)

  const photos: ArchPhoto[] = row.photos
    .filter((p) => !p.is_cover)
    .map((p) => ({
      image: p.image,
      caption: p.caption ?? undefined,
      width: p.width,
      height: p.height,
    }))

  const notes: ArchNote[] = row.notes.map((n) => ({
    text: n.text,
  }))

  const links: ArchLinks = {
    googleMaps: row.google_maps_url,
    wikipedia: undefined,
    archdaily: undefined,
    custom: [],
  }

  for (const link of row.links) {
    if (link.type === "wikipedia") {
      links.wikipedia = link.url
    } else if (link.type === "archdaily") {
      links.archdaily = link.url
    } else if (link.type === "custom") {
      links.custom!.push({ url: link.url, label: link.label })
    }
  }

  if (links.custom!.length === 0) {
    delete links.custom
  }

  return {
    slug: row.slug,
    name: row.name,
    architect: row.architect[0]?.name ?? "",
    year: row.year,
    coordinates: { lng: row.longitude, lat: row.latitude },
    coverImage: coverPhoto?.image ?? null,
    address: row.address,
    photos,
    notes,
    links,
  }
}
