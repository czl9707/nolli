import type { ArchSummary } from "@nolli/data"

/**
 * One building in the poster. Extends the ArchSummary shape (so the array can
 * feed @nolli/map's useMapClustering directly) and tightens `cover` to a
 * non-null photo with known dimensions — poster filters out buildings without a
 * usable cover, so every remaining marker has an aspect ratio.
 */
export type PosterBuilding = Omit<ArchSummary, "cover"> & {
  cover: { image: string; width: number; height: number }
}
