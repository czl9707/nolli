import * as React from "react"
import { ScrollArea as SA } from "radix-ui"
import styles from "./scroll-area.module.css"

function ScrollArea({
  className,
  children,
  scrollbars = "vertical",
  ...props
}: React.ComponentProps<typeof SA.Root> & {
  scrollbars?: "vertical" | "horizontal" | "both"
}) {
  return (
    <SA.Root
      data-slot="scroll-area"
      className={`${styles.root} ${className ?? ""}`}
      {...props}
    >
      <SA.Viewport
        data-slot="scroll-area-viewport"
        className={styles.viewport}
      >
        {children}
      </SA.Viewport>
      {(scrollbars === "vertical" || scrollbars === "both") && <ScrollBar />}
      {(scrollbars === "horizontal" || scrollbars === "both") && (
        <ScrollBar orientation="horizontal" />
      )}
      <SA.Corner />
    </SA.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof SA.ScrollAreaScrollbar>) {
  return (
    <SA.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={`${styles.scrollbar} ${className ?? ""}`}
      {...props}
    >
      <SA.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={styles.thumb}
      />
    </SA.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
