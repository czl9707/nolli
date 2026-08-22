import type { SceneCamera } from "@nolli/map"

export const HERO_SLUG = "centre-pompidou"
export const CLUSTER_CITY = "Paris"
export const BOARD_SLUGS = [
  "centre-pompidou",
  "cite-de-refuge",
  "musee-du-quai-branly",
  "french-communist-party-headquarters",
  "fondation-louis-vuitton",
] as const
export const APP_URL = "https://nolli-map.com"

export const SITE_ZOOM = 15.6
export const WORLD_CAMERA: SceneCamera = { center: [10, 25], zoom: 1.5 }
export const CLUSTER_CAMERA: SceneCamera = { center: [2.3522, 48.8606], zoom: 10.8 }
// Far-south pin-less emptiness — Southern Ocean. Tune visually in Task 11.
export const SOUTH_CAMERA: SceneCamera = { center: [0, -62], zoom: 3 }
