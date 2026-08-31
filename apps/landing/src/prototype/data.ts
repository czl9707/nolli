// PROTOTYPE — data. Reuses the landing db pipeline: Paris picks come with the
// landing data; the other index cities preload once via filter options.
import { useEffect, useMemo, useState } from "react"
import { useDbStore, type ArchSummary } from "@nolli/data"
import { useLandingData } from "@/lib/landing-data"
import { cityIdByName, pickIndexPhotos } from "@/lib/shape"

export const CITIES = ["Paris", "New York", "Tokyo", "London", "Chicago", "Berlin"] as const

const PICKS_PER_CITY = 8

// ── mock mode (?mock=1) — layout verification without the db ──────────────

const mockArch = (
  city: string,
  name: string,
  architect: string,
  year: number,
  lng: number,
  lat: number,
): ArchSummary => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return {
    id: 0,
    slug,
    name,
    architect,
    year,
    coordinates: { lng, lat },
    cover: { image: `https://picsum.photos/seed/${slug}/640/700`, width: 640, height: 700 },
    // city kept for debugging via React devtools
    ...({ city } as object),
  }
}

const MOCK_PICKS: Record<string, ArchSummary[]> = {
  Paris: [
    mockArch("Paris", "Centre Pompidou", "Renzo Piano", 1977, 2.3522, 48.8606),
    mockArch("Paris", "Louvre Pyramid", "I. M. Pei", 1989, 2.3355, 48.861),
    mockArch("Paris", "Eiffel Tower", "Gustave Eiffel", 1889, 2.2945, 48.8584),
    mockArch("Paris", "Fondation Louis Vuitton", "Frank Gehry", 2014, 2.2633, 48.8766),
    mockArch("Paris", "Philharmonie de Paris", "Jean Nouvel", 2015, 2.3934, 48.8895),
    mockArch("Paris", "Institut du Monde Arabe", "Jean Nouvel", 1987, 2.355, 48.8495),
    mockArch("Paris", "Palais de Tokyo", "Jean-Claude Dondel", 1937, 2.2975, 48.864),
    mockArch("Paris", "Musée d'Orsay", "Victor Laloux", 1900, 2.3266, 48.86),
  ],
  "New York": [
    mockArch("New York", "Guggenheim Museum", "Frank Lloyd Wright", 1959, -73.959, 40.783),
    mockArch("New York", "Seagram Building", "Mies van der Rohe", 1958, -73.969, 40.758),
    mockArch("New York", "Whitney Museum", "Renzo Piano", 2015, -74.009, 40.739),
    mockArch("New York", "Flatiron Building", "Daniel Burnham", 1902, -73.99, 40.741),
    mockArch("New York", "Chrysler Building", "William Van Alen", 1930, -73.975, 40.751),
  ],
  Tokyo: [
    mockArch("Tokyo", "Yoyogi National Gymnasium", "Kenzo Tange", 1964, 139.673, 35.677),
    mockArch("Tokyo", "Nakagin Capsule Tower", "Kisho Kurokawa", 1972, 139.759, 35.665),
    mockArch("Tokyo", "St Mary's Cathedral", "Kenzo Tange", 1964, 139.743, 35.708),
    mockArch("Tokyo", "Prada Aoyama", "Herzog & de Meuron", 2003, 139.709, 35.662),
  ],
  London: [
    mockArch("London", "Tate Modern", "Herzog & de Meuron", 2000, -0.099, 51.508),
    mockArch("London", "Barbican Estate", "Chamberlin, Powell and Bon", 1982, -0.093, 51.52),
    mockArch("London", "Lloyd's Building", "Richard Rogers", 1986, -0.085, 51.513),
    mockArch("London", "The Shard", "Renzo Piano", 2012, -0.087, 51.504),
  ],
  Chicago: [
    mockArch("Chicago", "Farnsworth House", "Mies van der Rohe", 1951, -88.254, 41.798),
    mockArch("Chicago", "Robie House", "Frank Lloyd Wright", 1910, -87.596, 41.789),
    mockArch("Chicago", "Marina City", "Bertrand Goldberg", 1964, -87.64, 41.887),
    mockArch("Chicago", "S. R. Crown Hall", "Mies van der Rohe", 1956, -87.63, 41.798),
  ],
  Berlin: [
    mockArch("Berlin", "Neue Nationalgalerie", "Mies van der Rohe", 1968, 13.366, 52.507),
    mockArch("Berlin", "Jewish Museum", "Daniel Libeskind", 2001, 13.394, 52.495),
    mockArch("Berlin", "Berliner Philharmonie", "Hans Scharoun", 1963, 13.365, 52.51),
    mockArch("Berlin", "Bauhaus-Archiv", "Walter Gropius", 1979, 13.371, 52.507),
  ],
}

export function usePrototypeData() {
  const mock = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("mock")
  const { status, data, error } = useLandingData()

  // mock mode skips the db entirely — layout/interaction verification only
  const mockData = useMemo(
    () =>
      mock
        ? ({
            status: "ready" as const,
            error: null,
            data: { indexPhotos: MOCK_PICKS.Paris, cluster: MOCK_PICKS.Paris },
            picksByCity: MOCK_PICKS,
          })
        : null,
    [mock],
  )

  const real = usePrototypeRealData(status, error, data)
  if (mockData) return mockData
  return real
}

function usePrototypeRealData(
  status: ReturnType<typeof useLandingData>["status"],
  error: ReturnType<typeof useLandingData>["error"],
  data: ReturnType<typeof useLandingData>["data"],
) {
  const dataSource = useDbStore((s) => s.dataSource)

  const [byCity, setByCity] = useState<Record<string, ArchSummary[]>>(() => ({
    Paris: data?.indexPhotos ?? [],
  }))

  useEffect(() => {
    if (data) setByCity((prev) => ({ ...prev, Paris: data.indexPhotos }))
  }, [data])

  useEffect(() => {
    if (!dataSource || !data) return
    let cancelled = false
    ;(async () => {
      try {
        const options = await dataSource.getFilterOptions()
        const entries = await Promise.all(
          CITIES.filter((c) => c !== "Paris").map(async (name) => {
            const id = cityIdByName(options, name)
            if (!id) throw new Error(`index city "${name}" not found`)
            return [name, await dataSource.getAllArchitectures({ cityIds: [id] })] as const
          }),
        )
        if (!cancelled) setByCity((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      } catch {
        // cities that didn't load stay dim in the list
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dataSource, data])

  const picksByCity = useMemo(() => {
    const out: Record<string, ArchSummary[]> = {}
    for (const name of CITIES) {
      const items = byCity[name]
      if (!items?.length) continue
      out[name] =
        name === "Paris" ? items : pickIndexPhotos(items, items[0].coordinates, PICKS_PER_CITY)
    }
    return out
  }, [byCity])

  return { status, error, data, picksByCity }
}
