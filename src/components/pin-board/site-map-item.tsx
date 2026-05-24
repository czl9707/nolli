import type { PlacedItem } from "@/lib/pin-board-layout"
import { BoardItem } from "./board-item"
import { MapCore } from "@/components/map"
import styles from "./site-map-item.module.css"

type SiteMapItemProps = {
  item: PlacedItem
}

export function SiteMapItem({ item }: SiteMapItemProps) {
  return (
    <BoardItem item={item} delay={0}>
      <div className={styles.print}>
        <MapCore />
      </div>
    </BoardItem>
  )
}
