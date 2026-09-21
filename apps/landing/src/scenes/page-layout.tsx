// Hairline page-grid primitives for the landing spine — the column-field
// counterpart to grid.tsx (which stays until every scene has migrated).
// A Screen is a native CSS grid on --page-cols; panes place onto cells and
// rules are standalone grid children, so lines and content are decoupled.
import { type CSSProperties, type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react"
import styles from "./page-layout.module.css"

/** Full-bleed layer inside a screen (map background) — covers the whole
 * viewport, padding included. */
export function Bleed({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={[styles.bleed, className].filter(Boolean).join(" ")}>{children}</div>
}

export const Screen = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string; style?: CSSProperties; height?: string;}
>(function Screen({ children, className, height = "100svh", style}, ref) {
  return (
    <section
      ref={ref}
      className={[styles.screen, className].filter(Boolean).join(" ")}
      style={{...style, height} as CSSProperties}
    >
      {children}
    </section>
  )
})

export type PaneProps = ComponentPropsWithoutRef<"div"> & {
  /** grid-column value, e.g. "1 / span 2". Default: next free cell. */
  col?: string
  /** Texture ground (grass pattern + tint). */
  filled?: boolean
  /** Texture + frost — the vellum recipe; blurs the ground with the map
   * behind the pane. */
  blurred?: boolean
  children?: ReactNode
}

export const Pane = forwardRef<HTMLDivElement, PaneProps>(
  function Pane({ col, filled, blurred, className, style, children, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={
          [styles.pane, filled ? styles.paneFilled : "", blurred ? styles.paneBlurred : "", className]
            .filter(Boolean)
            .join(" ")
        }
        style={{ gridColumn: col, ...style }}
        {...rest}
      >
        {children}
      </div>
    )
  },
)

/** Horizontal hairline. `col` spans cells inside the page padding
 * (default 1 / -1); `full` bleeds the rule past the padding to the
 * viewport edges. An opaque pane placed over the same cells covers it. */
export const Rule = forwardRef<
  HTMLDivElement,
  { col?: string; full?: boolean; className?: string; style?: CSSProperties }
>(function Rule({ col = "1 / -1", full, className, style }, ref) {
  return (
    <div
      ref={ref}
      className={[styles.rule, full ? styles.ruleFull : "", className].filter(Boolean).join(" ")}
      style={{ gridColumn: col, ...style }}
    />
  )
})
