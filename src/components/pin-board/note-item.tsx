import { useMemo } from "react"
import type { ArchNote } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { BoardItem, paperClipPath } from "./board-item"
import styles from "./note-item.module.css"

type NoteItemProps = {
  note: ArchNote
  item: PlacedItem
  delay: number
}

export function NoteItem({ note, item, delay }: NoteItemProps) {
  const clipPath = useMemo(() => paperClipPath(item.rotation), [item])

  return (
    <BoardItem item={item} delay={delay} className={styles.note} style={{ clipPath }}>
      {note.text}
    </BoardItem>
  )
}
