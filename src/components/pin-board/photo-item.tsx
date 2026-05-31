import { useState } from "react"
import type { ArchPhoto } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { Body2 } from "@/components/ui/typography"
import { BoardItem } from "./board-item"
import { BoardModal } from "./board-modal"
import styles from "./photo-item.module.css"
import boardItemStyles from "./board-item.module.css"

type PhotoItemProps = {
  photo: ArchPhoto
  item: PlacedItem
  delay: number
}

export function PhotoItem({ photo, item, delay }: PhotoItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <BoardItem item={item} delay={delay} onClick={() => setOpen(true)}>
        <img src={photo.image} alt="" className={styles.photo} />
        {photo.caption && <div className={styles.caption}><Body2>{photo.caption}</Body2></div>}
      </BoardItem>
      <BoardModal open={open} onClose={() => setOpen(false)} tapeId={item.id}>
        <div
          className={`${boardItemStyles.item} ${photo.width > photo.height ? styles.modalPhoto_width : styles.modalPhoto_height}`}
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        >
          <img src={photo.image} alt="" className={`${styles.photo} `} />
          {photo.caption && (
            <div className={styles.caption}><Body2>{photo.caption}</Body2></div>
          )}
        </div>
      </BoardModal>
    </>
  )
}
