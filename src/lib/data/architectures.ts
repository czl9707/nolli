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
    photos: [
      { image: "/images/seagram-1.jpg", caption: "Lorem Ipsum Dolor" },
      { image: "/images/seagram-2.jpg", caption: "Ut enim ad minim veniam" },
      { image: "/images/seagram-3.jpg" },
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
          url: "https://www.example.com/mies-van-der-rohe",
          label: "Mies van der Rohe Archive",
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
          title: "Lorem Ipsum Dolor",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        },
      },
      {
        image: "/images/exeter-academy-library-2.jpg",
        caption: {
          text: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        },
      },
      {
        image: "/images/exeter-academy-library-3.jpg",
        caption: {
          text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        },
      },
    ],
    photos: [
      { image: "/images/exeter-academy-library-1.jpg", caption: "Lorem Ipsum Dolor" },
      { image: "/images/exeter-academy-library-2.jpg", caption: "Ut enim ad minim veniam" },
      { image: "/images/exeter-academy-library-3.jpg", caption: "Duis aute irure dolor" },
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
