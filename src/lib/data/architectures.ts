export type ArchPage = {
  image: string
  caption?: {
    title?: string
    text?: string
  }
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

export type Coordinates = {
  latitude: number
  longitude: number
}

export type ArchLinks = {
  googleMaps: string
  wikipedia?: string
  archdaily?: string
  custom?: { url: string; label: string }[]
}

export type Arch = {
  slug: string
  name: string
  architect: string
  year: string
  address: string
  coordinates: Coordinates
  pages: ArchPage[]
  photos: ArchPhoto[]
  notes: ArchNote[]
  links: ArchLinks
}

const architectures: Record<string, Arch> = {
  "seagram-building": {
    slug: "seagram-building",
    name: "Seagram Building",
    architect: "Ludwig Mies van der Rohe",
    year: "1958",
    address: "375 Park Avenue, Manhattan, New York 10152, U.S.",
    coordinates: { latitude: 40.7586, longitude: -73.9722 },
    pages: [
      {
        image: "/images/seagram-1.jpg",
        caption: {
          title: "Bronze and Glass",
          text: "Mies set the tower back 100 feet from Park Avenue, creating one of the first corporate plazas in New York City and changing zoning law forever.",
        },
      },
      {
        image: "/images/seagram-2.jpg",
        caption: {
          text: "The amber-glass curtain wall and exposed bronze mullions give the facade a warmth rare among International Style towers.",
        },
      },
      {
        image: "/images/seagram-3.jpg",
      },
    ],
    photos: [
      { image: "/images/seagram-1.jpg", caption: "Bronze and Glass", width: 340, height: 260 },
      { image: "/images/seagram-2.jpg", caption: "Amber glass curtain wall", width: 280, height: 380 },
      { image: "/images/seagram-3.jpg", width: 320, height: 300 },
    ],
    notes: [
      { text: "One of the most influential buildings in modern architecture. The plaza set the standard for corporate public space in NYC." },
    ],
    links: {
      googleMaps: "https://maps.google.com/?q=40.7586,-73.9722",
      wikipedia: "https://en.wikipedia.org/wiki/Seagram_Building",
      archdaily: "https://www.archdaily.com/tag/seagram-building",
      custom: [
        {
          url: "https://www.moma.org/artists/7166",
          label: "Mies van der Rohe at MoMA",
        },
      ],
    },
  },
  "exeter-academy-library": {
    slug: "exeter-academy-library",
    name: "Exeter Academy Library",
    architect: "Louis Kahn",
    year: "1965",
    address: "21 Rear Elm St, Exeter, NH 03833",
    coordinates: { latitude: 42.9789, longitude: -70.9494 },
    pages: [
      {
        image: "/images/exeter-academy-library-1.jpg",
        caption: {
          title: "A Cathedral of Learning",
          text: "Kahn organized the building as three concentric squares: an outer brick ring with reading carrels, a middle concrete zone for book stacks, and an inner atrium flooded with daylight.",
        },
      },
      {
        image: "/images/exeter-academy-library-2.jpg",
        caption: {
          text: "Each carrel is a windowed alcove carved into the brick piers, giving every reader a private space facing the campus.",
        },
      },
      {
        image: "/images/exeter-academy-library-3.jpg",
        caption: {
          text: "The five-story central atrium wraps around balconies with massive concrete cross-beams, filtering light deep into the building.",
        },
      },
    ],
    photos: [
      { image: "/images/exeter-academy-library-1.jpg", caption: "A Cathedral of Learning", width: 340, height: 260 },
      { image: "/images/exeter-academy-library-2.jpg", caption: "Windowed reading carrels", width: 280, height: 380 },
      { image: "/images/exeter-academy-library-3.jpg", caption: "Central atrium", width: 320, height: 300 },
    ],
    notes: [
      { text: "Kahn's masterwork. The brick exterior and inner concrete atrium create one of the most powerful library spaces ever built." },
    ],
    links: {
      googleMaps: "https://maps.google.com/?q=42.9789,-70.9494",
      wikipedia: "https://en.wikipedia.org/wiki/Phillips_Exeter_Academy_Library",
    },
  }
}

export function getArchBySlug(slug: string): Arch | null {
  return architectures[slug] ?? null
}

export function getAllArchitectures(): Arch[] {
  return Object.values(architectures)
}
