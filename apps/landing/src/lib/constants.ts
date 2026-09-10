import type { SceneCamera } from "@nolli/map"

export const APP_URL = "https://nolli-map.com"
export const POSTER_URL = "https://poster.nolli-map.com"
export const ABOUT_URL = "https://nolli-map.com/about"

/** Architect-ledger names — matched against the DB's architect options;
 * unmatched names drop out so the list follows the seed data. */
export const ARCHITECT_LEDGER = [
  "Louis Kahn", "Le Corbusier",  "Frank Gehry", "Oscar Niemeyer", "SANAA", "Zaha Hadid", "Norman Foster", "Peter Zumthor",
]

/** Curated city decks — slug lists per city, shared by the hero (random
 * pick) and the city scene; the hero's pick is the city scene's default.
 * Only slugs live here — details come from the DB; slugs that don't
 * resolve drop out at load. */
export const CITY_DECK: Record<string, readonly string[]> = {
  "New York": [
    // "100-11th-avenue",
    // "215-chrystie-street",
    // "270-park-avenue",
    // "40-bond-street",
    // "425-park-avenue",
    // "50-hudson-yards",
    "520-west-28th-street",
    "56-leonard-street",
    // "eight-spruce-street",
    "fdr-four-freedoms-park",
    "hearst-tower",
    "iac-building",
    "metlife-building",
    "new-museum-new-york",
    "new-york-times-building",
    // "perry-street-condominiums",
    "seagram-building",
    // "guggenheim-museum",
    "whitney-museum-of-american-art",
  ],
  London: [
    "the-gherkin-30-st-mary-axe",
    "bloomberg-european-headquarters",
    // "london-aquatics-centre",
    "london-city-hall",
    "one-new-change",
    "tate-modern",
    "the-shard",
  ],
  Paris: [
    "centre-pompidou",
    "fondation-cartier",
    "pathe-foundation",
    "french-communist-party-headquarters",
    "institut-du-monde-arabe",
    "cite-de-refuge",
    "fondation-louis-vuitton",
    "maison-la-roche",
    "musee-du-quai-branly",
    "philharmonie-de-paris",
  ],
  Tokyo: [
    "2121-design-sight",
    "tods-omotesando-building",
    "curtain-wall-house",
    "mikimoto-ginza-2",
    "national-museum-western-art",
    "prada-aoyama",
    "sumida-hokusai-museum",
  ],
  Chicago: [
    "860-880-lake-shore-drive",
    "iit-alumni-memorial-hall",
    "chicago-federal-complex",
    "robie-house",
    "ibm-plaza",
    "mccormick-tribune-campus-center",
    "crown-hall",
  ],
  Berlin: [
    "axel-springer-campus",
    "netherlands-embassy-berlin",
    "neue-nationalgalerie",
    "reichstag-dome",
  ],
}

/** City-ledger names, in grid order. */
export const CITY_LEDGER = Object.keys(CITY_DECK)

/** Curated photo deck for the stats scene — canonical modern landmarks,
 *  one per master. */
export const STATS_DECK_SLUGS = [
  "farnsworth-house",
  "notre-dame-du-haut",
  "salk-institute",
  "guggenheim-museum",
  "bauhaus-dessau",
]

/** Cell roll easing — CSS mirror --ease-roll in styles/global.css */
export const ROLL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const WORLD_CAMERA: SceneCamera = { center: [10, 25], zoom: 1.5 }

/** Hero camera fit insets off the stage rect (px): left clears the centered
 * lede, x pads the column side, top/bottom keep the pin band level with the
 * lede (horizontal separation keeps them apart). */
export const HERO_FIT_PAD = { left: 100, right: 150, top: 100, bottom: 350 }
