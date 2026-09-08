import type { SceneCamera } from "@nolli/map"

export const HERO_SLUG = "centre-pompidou"
export const CLUSTER_CITY = "Paris"
export const APP_URL = "https://nolli-map.com"
export const POSTER_URL = "https://poster.nolli-map.com"
export const ABOUT_URL = "https://nolli-map.com/about"

/** Architect-ledger names — matched against the DB's architect options;
 * unmatched names drop out so the list follows the seed data. */
export const ARCHITECT_LEDGER = [
  "Louis Kahn", "Le Corbusier",  "Frank Gehry", "Oscar Niemeyer", "SANAA", "Zaha Hadid", "Norman Foster", "Peter Zumthor",
]

/** Curated photo deck for the stats scene — canonical modern landmarks,
 *  one per master. */
export const STATS_DECK_SLUGS = [
  "farnsworth-house",
  "notre-dame-du-haut",
  "salk-institute",
  "guggenheim-museum",
  "bauhaus-dessau",
]

export const WORLD_CAMERA: SceneCamera = { center: [10, 25], zoom: 1.5 }
// Hero dwells on the cluster city itself — the cursor plate reveals the
// photo pins there (bare map outside the plate)
export const HERO_CAMERA: SceneCamera = { center: [2.3522, 48.8606], zoom: 11.2 }
