import { useState } from "react"
import { useSidebarStore } from "@/stores/sidebar"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayoutStore } from "@/stores/layout"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_INSTANT, TRANSITION_SHORT } from "@/lib/constants"
import { OperationPanel } from "./operation-panel"
import { ArchSummary } from "./arch-summary"
import { NavRail } from "@/components/nav/nav-rail"
import { useIsMobile } from "@/hooks/use-is-mobile"
import styles from "./sidebar.module.css"

const contentVariants = {
  enter: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? -40 : 40,
    opacity: 0,
  }),
}

export function Sidebar() {
  const isMobile = useIsMobile()
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const selectedArch = useArchDetailStore((s) => s.selected)
  const mode = useLayoutStore((s) => s.mode)

  const sidebarView = selectedArch ? "arch" : "panel"

  const [[view, direction], setView] = useState<
    [string, "forward" | "backward"]
  >([sidebarView, "forward"])

  // On mobile, sidebar renders nothing — content is in BottomSheet
  if (isMobile) return null

  const isOpen = mode === "home" && sidebarOpen

  if (view !== sidebarView) {
    setView([
      sidebarView,
      sidebarView === "arch" ? "forward" : "backward",
    ])
  }

  const transition = {
    duration: TRANSITION_INSTANT,
    ease: "easeInOut" as const,
  }

  return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar"
            className={styles.sidebarOuter}
            animate={{ width: "var(--size-sidebar-width)" }}
            exit={{ width: 0 }}
            transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className={styles.panelWrapper}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={view}
                  className={styles.panelContent}
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={transition}
                >
                  {sidebarView === "arch" ? (
                    <ArchSummary />
                  ) : (
                    <OperationPanel />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  )
}
