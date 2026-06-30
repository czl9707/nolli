import type { ArchSummary } from "@nolli/data"

/**
 * One building in the poster snapshot. Extends the ArchSummary shape (so the
 * array can feed @nolli/map's useMapClustering directly) and adds the cover
 * photo's dimensions for the photo marker's aspect ratio.
 */
export type PosterBuilding = ArchSummary & {
  cover: { image: string; width: number; height: number }
}
