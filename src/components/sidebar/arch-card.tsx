import type { ArchSummary } from "@/lib/data/architectures.type"
import { useMapSelectStore } from "@/stores/map-select"
import { useMap } from "@/components/ui/map"
import { flyToArchIfNeeded } from "@/lib/map-flyto"
import { Box } from "lucide-react"
import styles from "./arch-card.module.css"

export function ArchCard({ arch }: { arch: ArchSummary }) {
  const selectedSummary = useMapSelectStore((s) => s.selectedSummary)
  const selectOnMap = useMapSelectStore((s) => s.selectOnMap)
  const deselectOnMap = useMapSelectStore((s) => s.deselectOnMap)
  const { map } = useMap()
  const isSelected = selectedSummary?.slug === arch.slug

  const handleClick = () => {
    if (isSelected) {
      deselectOnMap()
    } else {
      selectOnMap(arch)
      if (map) {
        flyToArchIfNeeded(
          map,
          arch.coordinates.lng,
          arch.coordinates.lat,
        )
      }
    }
  }

  return (
    <div
      className={styles.card}
      data-selected={isSelected}
      onClick={handleClick}
    >
      {arch.coverImage ? (
        <img
          className={styles.image}
          src={arch.coverImage}
          alt={arch.name}
          loading="lazy"
        />
      ) : (
        <div className={styles.placeholder}>
          <Box size={16} opacity={0.3} />
        </div>
      )}
      <div className={styles.textBlock}>
        <span className={styles.name}>{arch.name}</span>
        <span className={styles.architect}>{arch.architect}</span>
      </div>
    </div>
  )
}
