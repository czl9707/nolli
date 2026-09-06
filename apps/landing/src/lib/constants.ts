import type { SceneCamera } from "@nolli/map"

export const HERO_SLUG = "centre-pompidou"
export const CLUSTER_CITY = "Paris"
export const APP_URL = "https://nolli-map.com"
export const POSTER_URL = "https://poster.nolli-map.com"
export const ABOUT_URL = "https://nolli-map.com/about"

/** Architect-scene roster — matched against the DB's architect options;
 * unmatched names drop out so the list follows the seed data. */
export const ARCH_ROSTER = [
  "Tadao Ando", "Frank Gehry", "Zaha Hadid", "Oscar Niemeyer",
  "Le Corbusier", "Mies van der Rohe", "Kengo Kuma", "SANAA",
  "Renzo Piano", "Norman Foster", "Peter Zumthor", "Alvar Siza",
]

export const WORLD_CAMERA: SceneCamera = { center: [10, 25], zoom: 1.5 }
// Hero dwells on the cluster city itself — the cursor plate reveals the
// photo pins there (bare map outside the plate)
export const HERO_CAMERA: SceneCamera = { center: [2.3522, 48.8606], zoom: 11.2 }
