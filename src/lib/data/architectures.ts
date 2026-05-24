export type ArchPage = {
  image: string
  caption?: {
    title?: string
    text?: string
  }
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
          title: "Lorem Ipsum Dolor",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
      },
      {
        image: "/images/seagram-2.jpg",
        caption: {
          text: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        },
      },
      {
        image: "/images/seagram-3.jpg",
      },
    ],
    links: {
      googleMaps: "https://maps.google.com/?q=40.7586,-73.9722",
      wikipedia: "https://en.wikipedia.org/wiki/Seagram_Building",
      archdaily: "https://www.archdaily.com/tag/seagram-building",
      custom: [
        {
          url: "https://www.example.com/mies-van-der-rohe",
          label: "Mies van der Rohe Archive",
        },
      ],
    },
  },
}

export function getArchBySlug(slug: string): Arch | null {
  return architectures[slug] ?? null
}

export function getAllArchitectures(): Arch[] {
  return Object.values(architectures)
}
