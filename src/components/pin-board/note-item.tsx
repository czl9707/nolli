import { useState } from "react"
import type { ArchNote } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { Body2 } from "@/components/ui/typography"
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
        <Body2>{note.text}</Body2>
      </BoardItem>
      <BoardModal open={open} onClose={() => setOpen(false)}>
        <div
          className={`${styles.note} ${boardItemStyles.item} ${styles.modalNote}`}
        >
          <Body2>{note.text}</Body2>
        </div>
      </BoardModal>
    </>
  )
}
