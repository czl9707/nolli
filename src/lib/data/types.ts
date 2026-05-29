export type Coordinates = {
  lng: number
  lat: number
}

export type BBox = {
  west: number
  south: number
  east: number
  north: number
}

export type ArchPhoto = {
  image: string
  caption?: string
  width: number
  height: number
}

export type ArchNote = {
  text: string
}

export type ArchLinks = {
  googleMaps: string
  wikipedia?: string
  archdaily?: string
  custom?: { url: string; label: string }[]
}

export type ArchSummary = {
  slug: string
  name: string
  architect: string
  year: number
  coordinates: Coordinates
  coverImage: string | null
}

export type Arch = ArchSummary & {
  address: string
  photos: ArchPhoto[]
  notes: ArchNote[]
  links: ArchLinks
}
