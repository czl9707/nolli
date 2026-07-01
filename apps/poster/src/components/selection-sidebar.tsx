import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"
import { useUiStore } from "@/stores/ui"
import { TRANSITION_SHORT } from "@nolli/ui"
import styles from "./selection-sidebar.module.css"

/** Desktop left panel — an in-flow column of the app shell. Animates its width
 *  on open/close; collapses (unmounts) when the sidebar is closed. */
export function SelectionSidebar({ children }: { children: ReactNode }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          className={styles.sidebarOuter}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "var(--size-sidebar-width)", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
        >
          <div className={styles.sidebarInner}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
