import { useMemo } from "react"
import type { ArchPhoto } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { BoardItem, paperClipPath } from "./board-item"
import styles from "./photo-item.module.css"

type PhotoItemProps = {
  photo: ArchPhoto
  item: PlacedItem
  delay: number
}

export function PhotoItem({ photo, item, delay }: PhotoItemProps) {
  const clipPath = useMemo(() => paperClipPath(item.rotation), [item])

  return (
    <BoardItem item={item} delay={delay} className={styles.photoWrapper} style={{ clipPath }}>
      <img src={photo.image} alt="" className={styles.photo} />
      {photo.caption && <div className={styles.caption}>{photo.caption}</div>}
    </BoardItem>
  )
}
