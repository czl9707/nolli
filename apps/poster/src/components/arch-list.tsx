import { Fragment, type ReactNode } from "react"
import { Body2, Body3, ScrollArea } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"
import styles from "./arch-list.module.css"

/**
 * Shared scaffolding for the poster's two building lists (overview multi-select
 * + spotlight single-select): the scroll container, the radix viewport width
 * fix, and the list layout. Each list supplies its own interactive row via
 * `renderItem`; pair it with <ArchListItemBody> for the shared thumbnail +
 * name/architect body so the row styling lives in one place (see
 * arch-list.module.css).
 */
export function ArchList({
  buildings,
  renderItem,
}: {
  buildings: ArchSummary[]
  renderItem: (building: ArchSummary) => ReactNode
}) {
  return (
    <ScrollArea className={styles.scroll}>
      <div className={styles.list}>
        {buildings.map((b) => (
          <Fragment key={b.slug}>{renderItem(b)}</Fragment>
        ))}
      </div>
    </ScrollArea>
  )
}

/**
 * The shared row body: square cover thumbnail + name / architect. Rendered
 * inside whichever interactive wrapper the caller chose — a <label> for the
 * multi-select overview list, a <Button> for the spotlight list.
 */
export function ArchListItemBody({ building }: { building: ArchSummary }) {
  return (
    <>
      <img
        className={styles.thumb}
        src={building.cover.image}
        alt=""
        crossOrigin="anonymous"
      />
      <span className={styles.text}>
        <Body2 className={styles.name}>{building.name}</Body2>
        <Body3 className={styles.architect}>{building.architect}</Body3>
      </span>
    </>
  )
}
