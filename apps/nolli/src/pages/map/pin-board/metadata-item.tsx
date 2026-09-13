import type { PlacedArchItem } from "@nolli/board"
import { BoardItem } from "@nolli/board"
import styles from "./metadata-item.module.css"
import { Note } from "@nolli/ui"
import { useArchDetailStore } from "@/stores/arch-detail"

type MetadataItemProps = Extract<PlacedArchItem, { kind: "metadata" }> & {
  delay: number
}

export function MetadataItem({
  name,
  architect,
  year,
  address,
  position,
  delay,
}: MetadataItemProps) {
  const id = useArchDetailStore((s) => s.selected?.id)
  return (
    <BoardItem
      id="metadata"
      position={position}
      delay={delay}
      className={styles.metaWrapper}
    >
      <Note className={styles.name}>{name}</Note>
      <div className={styles.meta}>
        <Note className={styles.architect}>
          <span style={{ opacity: 0.5 }}>By </span>
          {architect}
          <span style={{ opacity: 0.5 }}>, In </span>
          {year}
        </Note>
      </div>
      <span style={{ flex: "1 1" }}></span>
      <Note className={styles.address}>{address}</Note>
    </BoardItem>
  )
}
