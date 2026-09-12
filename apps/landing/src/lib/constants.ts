import type { SceneCamera } from "@nolli/map"

export const APP_URL = "https://nolli-map.com"
export const POSTER_URL = "https://poster.nolli-map.com"
export const ABOUT_URL = "https://nolli-map.com/about"

/** Architect-ledger decks — curated works per architect, in show order.
 * Only these slugs are baked into landing.json. */
export const ARCHITECT_DECK: Record<string, readonly string[]> = {
  "Louis Kahn": [
    "salk-institute",
    "phillips-exeter-library",
    "kimbell-art-museum",
    "yale-center-british-art",
    "fdr-four-freedoms-park",
  ],
  "Le Corbusier": [
    "villa-savoye",
    "notre-dame-du-haut",
    "capitol-complex-chandigarh",
    "couvent-sainte-marie-la-tourette",
    "national-museum-western-art",
  ],
  "Frank Gehry": [
    "guggenheim-museum-bilbao",
    "walt-disney-concert-hall",
    "dancing-house",
    "iac-building",
  ],
  "Oscar Niemeyer": [
    "palacio-da-alvorada",
    "national-congress-of-brazil",
    "cathedral-of-brasilia",
    "itamaraty-palace",
    "niteroi-museum-of-contemporary-art",
  ],
  "SANAA": [
    "kanazawa-21st-century-museum",
    "new-museum-new-york",
    "rolex-learning-center",
    "grace-farms",
    "sumida-hokusai-museum",
  ],
  "Zaha Hadid": [
    "vitra-fire-station",
    "maxxi",
    "guangzhou-opera-house",
    "heydar-aliyev-center",
    "520-west-28th-street",
  ],
  "Norman Foster": [
    "hsbc-main-building-hong-kong",
    "the-gherkin-30-st-mary-axe",
    "london-city-hall",
    "hearst-tower",
  ],
  "Peter Zumthor": [
    "saint-benedict-chapel-sumvitg",
    "vals-thermal-baths",
    "bruder-klaus-field-chapel",
    "kolumba-museum",
  ],
}

/** Architect-ledger names, in grid order. */
export const ARCHITECT_LEDGER = Object.keys(ARCHITECT_DECK)

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
