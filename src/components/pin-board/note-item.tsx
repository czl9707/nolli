import { useState } from "react"
import type { ArchNote } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { BoardItem } from "./board-item"
import { BoardModal } from "./board-modal"
import styles from "./note-item.module.css"
import boardItemStyles from "./board-item.module.css"

type NoteItemProps = {
  note: ArchNote
  item: PlacedItem
  delay: number
}

export function NoteItem({ note, item, delay }: NoteItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <BoardItem
        item={item}
        delay={delay}
        className={styles.note}
        onClick={() => setOpen(true)}
      >
        {note.text}
      </BoardItem>
      <BoardModal open={open} onClose={() => setOpen(false)}>
        <div
          className={`${styles.note} ${boardItemStyles.item} ${styles.modalNote}`}
        >
          {note.text}
        </div>
      </BoardModal>
    </>
  )
}
