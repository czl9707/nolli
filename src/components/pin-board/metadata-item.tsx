import type { PlacedArchItem } from "@/lib/pin-board-layout"
import { BoardItem } from "./board-item"
import styles from "./metadata-item.module.css"
import { Body1, H3, H6 } from "@/components/ui/typography"

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
  return (
    <BoardItem
      id="metadata"
      position={position}
      delay={delay}
      className={styles.metaWrapper}
    >
      <H3 className={styles.name}>{name}</H3>
      <div className={styles.meta}>
        <H6 className={styles.architect}>
          <span style={{ opacity: 0.5 }}>By </span>
          {architect}
          <span style={{ opacity: 0.5 }}>, In </span>
          {year}
        </H6>
      </div>
      <span style={{ flex: "1 1" }}></span>
      <Body1 className={styles.address}>{address}</Body1>
    </BoardItem>
  )
}
