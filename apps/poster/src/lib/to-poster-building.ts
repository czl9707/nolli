import type { ArchSummary } from "@nolli/data"
import type { PosterBuilding } from "@/types"

/**
 * Maps an ArchSummary to a PosterBuilding, dropping any without a usable
 * cover photo (no image / unknown dimensions). Shared by the initial load
 * and the filter-results path so both apply the same cover filter.
 */
export function toPosterBuilding(a: ArchSummary): PosterBuilding | null {
  const { image, width, height } = a.cover
  if (!image || !width || !height) return null
  return { ...a, cover: { image, width, height } }
}
