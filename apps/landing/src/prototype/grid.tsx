// PROTOTYPE — grid primitives shared by every variant. Layout system under
// test; variants only decide how scenes split into cells.
import type { CSSProperties, ReactNode } from "react"
import styles from "./grid.module.css"

export function Scene({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={[styles.scene, className].filter(Boolean).join(" ")}>{children}</section>
}

/** Content cell. `col`/`row` are 1-based start tracks, `colSpan`/`rowSpan`
 * how many tracks it fills. Vertical edges always sit on grid lines. */
export function Cell({
  col,
  colSpan = 1,
  row,
  rowSpan = 1,
  className,
  style,
  children,
}: {
  col: number
  colSpan?: number
  row: number
  rowSpan?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div
      className={[styles.cell, className].filter(Boolean).join(" ")}
      style={{
        gridColumn: `${col} / span ${colSpan}`,
        gridRow: `${row} / span ${rowSpan}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Full-bleed layer inside a scene (map background). Grid padding does not
 * apply — it covers the whole viewport. */
export function Bleed({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={[styles.bleed, className].filter(Boolean).join(" ")}>{children}</div>
}

// ── pane split model ─────────────────────────────────────────────────────
// HSplit/VSplit = flex rows/columns of <Pane>s. Each Pane declares its OWN
// size at the child level:
//   <Pane size="calc(var(--col-width) * 8)" />   8 of 12 col tracks
//   <Pane size="calc(var(--pad) + var(--col-width) * 2)" />
//                                                 margin + 2 cols, ONE pane
//   <Pane size="220px" />                         exact CSS length
//   <Pane />                                      fill the rest
// The border between sibling panes IS the split line, auto-drawn and kept.
// Panes land on the GLOBAL 12-col grid when the row starts at the screen
// edge and is preceded only by grid-aligned panes. Any number of panes per
// direction. Components live fully in one pane or are full screen (Bleed).

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={[styles.screen, className].filter(Boolean).join(" ")}>{children}</section>
}

/** Horizontal splits: children stack top-to-bottom, each declaring its height. */
export function HSplit({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.splitCell, styles.colSplit, className].filter(Boolean).join(" ")}>{children}</div>
}

/** Vertical splits: children stack left-to-right, each declaring its width. */
export function VSplit({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.splitCell, styles.rowSplit, className].filter(Boolean).join(" ")}>{children}</div>
}

export function Pane({
  size,
  className,
  style,
  children,
}: {
  /** Width/height as any CSS length — compose from var(--pad) and
   * var(--col-width). Omit to fill the rest. */
  size?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  const fill = size === undefined
  return (
    <div
      className={[styles.pane, fill ? styles.paneFill : "", className].filter(Boolean).join(" ")}
      style={{ flexBasis: size, ...style }}
    >
      {children}
    </div>
  )
}

/** Hairline at a column-track boundary (after column `i`, 0..6), optionally
 * only between row tracks `rowStart..rowEnd`. */
export function VRule({
  i,
  rowStart = 0,
  rowEnd = 6,
  muted = false,
}: {
  i: number
  rowStart?: number
  rowEnd?: number
  muted?: boolean
}) {
  return (
    <div
      className={`${styles.rule} ${styles.vrule}`}
      style={{
        left: `calc(var(--pad) + (100% - 2 * var(--pad)) * ${i / 6})`,
        top: `${(rowStart / 6) * 100}%`,
        bottom: `${(1 - rowEnd / 6) * 100}%`,
        opacity: muted ? 0.5 : 1,
      }}
    />
  )
}

/** Hairline at a row-track boundary (after row `i`, 0..6), optionally only
 * between column tracks `colStart..colEnd`. */
export function HRule({
  i,
  colStart = 0,
  colEnd = 6,
  muted = false,
}: {
  i: number
  colStart?: number
  colEnd?: number
  muted?: boolean
}) {
  return (
    <div
      className={`${styles.rule} ${styles.hrule}`}
      style={{
        top: `${(i / 6) * 100}%`,
        left: `calc(var(--pad) + (100% - 2 * var(--pad)) * ${colStart / 6})`,
        right: `calc(var(--pad) + (100% - 2 * var(--pad)) * ${(6 - colEnd) / 6})`,
        opacity: muted ? 0.5 : 1,
      }}
    />
  )
}
