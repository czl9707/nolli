import { useState } from "react"
import type { PlacedArchItem } from "@/lib/pin-board-layout"
import { Body2 } from "@/components/ui/typography"
import { BoardItem } from "./board-item"
import { BoardModal } from "./board-modal"
import styles from "./photo-item.module.css"

type PhotoItemProps = Extract<PlacedArchItem, { kind: "photo" }> & {
  delay: number
}

export function PhotoItem({ photo, position, delay }: PhotoItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <BoardItem
        id={`photo-${photo.image.slice(-8)}`}
        position={position}
        delay={delay}
        onClick={() => setOpen(true)}
      >
        <img src={photo.image} alt="" className={styles.photo} />
        {photo.caption && (
          <div className={styles.caption}>
            <Body2>{photo.caption}</Body2>
          </div>
        )}
      </BoardItem>
      <BoardModal open={open} onClose={() => setOpen(false)}>
        <div
          className={`${
            photo.width > photo.height
              ? styles.modalPhoto_width
              : styles.modalPhoto_height
          }`}
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        >
          <img src={photo.image} alt="" className={styles.photo} />
          {photo.caption && (
            <div className={styles.caption}>
              <Body2>{photo.caption}</Body2>
            </div>
          )}
        </div>
      </BoardModal>
    </>
  )
}
