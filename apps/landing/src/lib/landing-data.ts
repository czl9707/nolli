import bakedJson from "../data/landing.json"
import {
  ARCHITECT_DECK,
  ARCHITECT_LEDGER,
  CITY_DECK,
  CITY_LEDGER,
  STATS_DECK_SLUGS,
} from "./constants"

export type ArchSummary = {
  id: number
  slug: string
  name: string
  architect: string
  year: number
  coordinates: { lat: number; lng: number }
  cover: { image: string; width: number; height: number }
}

export type ArchEntry = {
  id: number
  name: string
  works: ArchSummary[]
}

export type HeroCity = {
  name: string
  /** ISO-2 code ("FR"), printed compact in the hero sheet */
  country: string
}

export type CollectionStats = {
  buildings: number
  architects: number
  countries: number
  /** Architecture count per ISO-2 country code — powers the where-you-are card */
  countryArchCounts: Record<string, number>
  /** Curated photo deck for the scene (STATS_DECK_SLUGS) */
  worldArchs: ArchSummary[]
}

export type LandingData = {
  /** The hero's random city + its deck of archs */
  heroCity: HeroCity
  heroArchs: ArchSummary[]
  /** Architect ledger: curated names matched to the baked data, each with its works */
  architectLedger: ArchEntry[]
  /** City ledger: decked archs per curated city, keyed by city name */
  cityLedger: Record<string, ArchSummary[]>
  /** Collection counts + photo deck for the stats scene — baked at build time */
  stats: CollectionStats
}

type LandingJson = {
  architects: { id: number; name: string }[]
  cities: { id: number; name: string; countryCode: string }[]
  /** Only the curated decks' architectures */
  all: ArchSummary[]
  /** Whole-collection count; `all` is a curated subset */
  buildingCount: number
  countryCounts: { code: string; count: number }[]
}

const baked = bakedJson as LandingJson
const bySlug = new Map(baked.all.map((a) => [a.slug, a]))

/** Resolve a deck's slugs to arch summaries in deck order — slugs that don't
 * resolve drop out. */
function deckArchs(slugs: readonly string[]): ArchSummary[] {
  return slugs.flatMap((slug) => {
    const hit = bySlug.get(slug)
    return hit ? [hit] : []
  })
}

/** Ledger for the architect scene — curated names and decks, in order;
 * names that don't match the DB drop out. */
function loadArchitectLedger(): ArchEntry[] {
  const byName = new Map(baked.architects.map((a) => [a.name.toLowerCase(), a]))
  return ARCHITECT_LEDGER.flatMap((name) => {
    const architect = byName.get(name.toLowerCase())
    return architect
      ? [{ id: architect.id, name, works: deckArchs(ARCHITECT_DECK[name]) }]
      : []
  })
}

function pickHeroCity(): HeroCity {
  const cities = CITY_LEDGER.filter((c) => c !== "Berlin");

  const name = cities[Math.floor(Math.random() * cities.length)]
  const country = baked.cities.find((c) => c.name === name)?.countryCode ?? ""
  return { name, country }
}

function buildLandingData(): LandingData {
  const heroCity = pickHeroCity()
  const heroArchs = deckArchs(CITY_DECK[heroCity.name])
  if (!heroArchs.length) throw new Error(`hero city "${heroCity.name}" deck is empty`)
  // cities whose whole deck fails to resolve stay dim in the grid
  const cityLedger = Object.fromEntries(
    Object.entries(CITY_DECK)
      .map(([name, slugs]) => [name, deckArchs(slugs)] as const)
      .filter(([, archs]) => archs.length > 0),
  )
  // cities/countries tables are get-or-created per building in the
  // seed, so distinct city country codes = countries with buildings
  const stats: CollectionStats = {
    buildings: baked.buildingCount,
    architects: baked.architects.length,
    countries: new Set(baked.cities.map((c) => c.countryCode)).size,
    countryArchCounts: Object.fromEntries(baked.countryCounts.map((c) => [c.code, c.count])),
    worldArchs: deckArchs(STATS_DECK_SLUGS),
  }
  return { heroCity, heroArchs, architectLedger: loadArchitectLedger(), cityLedger, stats }
}

// Baked data is static, so the landing payload (including the hero's
// random pick) is computed once per page load.
export const landingData: LandingData = buildLandingData()
