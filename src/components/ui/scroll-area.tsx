import * as React from "react"
import { ScrollArea as SA } from "radix-ui"
import styles from "./scroll-area.module.css"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SA.Root>) {
  return (
    <SA.Root
      data-slot="scroll-area"
      className={`${styles.root} ${className ?? ""}`}
      {...props}
    >
      <SA.Viewport
        data-slot="scroll-area-viewport"
        className={styles.viewport}
        style={{ overflow: "" }}  // Keep this for the card shadow preservation
      >
        {children}
      </SA.Viewport>
      <ScrollBar />
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
