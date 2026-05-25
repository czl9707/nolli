import { useMemo } from "react"
import type { Arch } from "@/lib/data/architectures"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { BoardItem, paperClipPath } from "./board-item"
import styles from "./metadata-item.module.css"
import { Body1, H3, H6 } from "@/components/ui/typography"

type MetadataItemProps = {
  arch: Arch
  item: PlacedItem
  delay: number
}

export function MetadataItem({ arch, item, delay }: MetadataItemProps) {
  const clipPath = useMemo(() => paperClipPath(item.rotation), [item])

  return (
    <BoardItem item={item} delay={delay} className={styles.metaWrapper} style={{ clipPath }}>
      <H3 className={styles.name}>{arch.name}</H3>
      <div className={styles.meta}>
        <H6 className={styles.architect}>
          <span style={{opacity: .5}}>By </span>
          {arch.architect}
          <span style={{opacity: .5}}>, In </span>
          {arch.year}
        </H6>
      </div>
      <span style={{flex: "1 1"}}></span>
      <Body1 className={styles.address}>
        {arch.address}
      </Body1>
    </BoardItem>
  )
}
