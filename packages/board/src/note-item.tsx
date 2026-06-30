import { useState } from "react"
import type { PlacedArchItem } from "./pin-board-layout"
import { Body2 } from "@nolli/ui"
import { BoardItem } from "./board-item"
import { BoardModal } from "./board-modal"
import styles from "./note-item.module.css"

type NoteItemProps = Extract<PlacedArchItem, { kind: "note" }> & {
  delay: number
}

export function NoteItem({ note, position, delay }: NoteItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <BoardItem
        id={`note-${note.text.slice(0, 8)}`}
        position={position}
        delay={delay}
        className={styles.note}
        onClick={() => setOpen(true)}
      >
        <Body2>{note.text}</Body2>
      </BoardItem>
      <BoardModal open={open} onClose={() => setOpen(false)}>
        <div className={`${styles.note} ${styles.modalNote}`}>
          <Body2>{note.text}</Body2>
        </div>
      </BoardModal>
    </>
  )
}
