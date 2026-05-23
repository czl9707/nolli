export type Arch = {
  slug: string
  name: string
  author: string
  year: string
  address: string
}

const architectures: Record<string, Arch> = {
  "sample-building": {
    slug: "sample-building",
    name: "Seagram Building",
    author: "Ludwig Mies van der Rohe",
    year: "1958",
    address: "375 Park Avenue, Manhattan, New York 10152, U.S.",
  },
}

export function getArchBySlug(slug: string): Arch | null {
  return architectures[slug] ?? null
}
