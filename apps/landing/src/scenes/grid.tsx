// Grid primitives for the landing spine. Layout system: a Screen is cut
// into panes; scenes only decide how screens split.
import type { CSSProperties, ReactNode } from "react"
import styles from "./grid.module.css"

/** Full-bleed layer inside a screen (map background) — covers the whole
 * viewport. */
export function Bleed({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={[styles.bleed, className].filter(Boolean).join(" ")}>{children}</div>
}

// ── pane split model ─────────────────────────────────────────────────────
// HSplit/VSplit = flex rows/columns of <Pane>s. Each Pane declares its OWN
// size at the child level:
//   <Pane size="calc(var(--grid-col) * 8)" />   8 of 12 col tracks
//   <Pane size="calc(var(--grid-padding) + var(--grid-col) * 2)" />
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
  children,
}: {
  /** Width/height as any CSS length — compose from var(--grid-padding) and
   * var(--grid-col). Omit to fill the rest. */
  size?: string
  className?: string
  children?: ReactNode
}) {
  const fill = size === undefined
  return (
    <div
      className={[styles.pane, fill ? styles.paneFill : "", className].filter(Boolean).join(" ")}
      style={{ flexBasis: size }}
    >
      {children}
    </div>
  )
}
