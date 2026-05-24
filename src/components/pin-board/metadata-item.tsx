import type { Arch } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { BoardItem } from "./board-item"
import styles from "./metadata-item.module.css"

type MetadataItemProps = {
  arch: Arch
  item: PlacedItem
  delay: number
}

export function MetadataItem({ arch, item, delay }: MetadataItemProps) {
  return (
    <BoardItem item={item} delay={delay}>
      <div className={styles.card}>
        <div>
          <div className={styles.name}>{arch.name}</div>
        </div>
        <div>
          <div className={styles.row}>
            <span className={styles.label}>Architect</span>
            <span className={styles.value}>{arch.architect}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Year</span>
            <span className={styles.value}>{arch.year}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Address</span>
            <span className={styles.value}>{arch.address}</span>
          </div>
        </div>
      </div>
    </BoardItem>
  )
}
