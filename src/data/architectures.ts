export type ArchPage = {
  image?: string
  text?: string
}

export type Arch = {
  slug: string
  name: string
  author: string
  year: string
  address: string
  pages: ArchPage[]
}

const architectures: Record<string, Arch> = {
  "sample-building": {
    slug: "sample-building",
    name: "Seagram Building",
    author: "Ludwig Mies van der Rohe",
    year: "1958",
    address: "375 Park Avenue, Manhattan, New York 10152, U.S.",
    pages: [
      {
        image: "/images/seagram-1.jpg",
        text: "The Seagram Building is a landmark of modernist architecture, designed by Ludwig Mies van der Rohe in collaboration with Philip Johnson. Completed in 1958, it stands at 375 Park Avenue in Manhattan and is widely regarded as one of the finest examples of the International Style. Its bronze and glass facade set a new standard for corporate skyscrapers and redefined the American cityscape.",
      },
      {
        image: "/images/seagram-2.jpg",
      },
      {
        text: "Mies van der Rohe deliberately set the tower back 100 feet from the street edge, creating a generous open plaza that became a model for New York City's 1961 zoning resolution. The building's exterior columns are expressed as non-structural I-beams clad in bronze, articulating the structural rhythm on the facade. The amber-tinted glass and bronze mullions produce a warm, reflective skin that changes character with the light throughout the day.",
      },
    ],
  },
}

export function getArchBySlug(slug: string): Arch | null {
  return architectures[slug] ?? null
}
