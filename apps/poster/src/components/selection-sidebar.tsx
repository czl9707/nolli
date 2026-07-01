import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"
import { useUiStore } from "@/stores/ui"
import styles from "./selection-sidebar.module.css"

/** Desktop-only left panel. Collapses (unmounts) when the sidebar is closed. */
export function SelectionSidebar({ children }: { children: ReactNode }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          className={styles.sidebarOuter}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "var(--size-sidebar-width, 360px)", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <div className={styles.panelWrapper}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
