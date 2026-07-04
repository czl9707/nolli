import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { TRANSITION_SHORT } from "@nolli/ui"
import styles from "./selection-sidebar.module.css"

/** Desktop left panel — an in-flow column of the app shell. Always visible:
 *  preview mode only clears the map frame (`.inset`), which the screenshot
 *  targets, so the sidebar can stay open as a working surface. Animates its
 *  width in on mount. */
export function SelectionSidebar({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className={styles.sidebarOuter}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: "var(--size-sidebar-width)", opacity: 1 }}
      transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
    >
      <div className={styles.sidebarInner}>{children}</div>
    </motion.div>
  )
}
