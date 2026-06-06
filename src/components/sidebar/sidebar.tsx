import { useState } from "react"
import { useSidebarStore } from "@/stores/sidebar"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayoutStore } from "@/stores/layout"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_INSTANT, TRANSITION_SHORT } from "@/lib/constants"
import { OperationPanel } from "./operation-panel"
import { ArchSummary } from "./arch-summary"
import { NavUser } from "./nav-user"
import { Button } from "@/components/ui/button"
import { Info, createLucideIcon } from "lucide-react"
import styles from "./sidebar.module.css"

const Github = createLucideIcon("github", [
  ["path", { key: "body", d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" }],
  ["path", { key: "tail", d: "M9 18c-4.51 2-5-2-7-2" }],
])

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
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const selectedArch = useArchDetailStore((s) => s.selected)
  const mode = useLayoutStore((s) => s.mode)
  const isOpen = mode === "home" && sidebarOpen
  const sidebarView = selectedArch ? "arch" : "panel"

  const [[view, direction], setView] = useState<
    [string, "forward" | "backward"]
  >([sidebarView, "forward"])

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
          className={styles.sidebarWrapper}
          initial={{ width: 0 }}
          animate={{ width: "var(--size-sidebar-width)" }}
          exit={{ width: 0 }}
          transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className={styles.sidebarContentWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
          >
            <div className={styles.sidebarContent}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={view}
                  className={styles.contentTransition}
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
            </div>
            <Footer/>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Footer(){
  return (
    <div className={styles.footer}>
      <Button variant="ghost" className={styles.footerLink}>
        <Info size={16} />
        About
      </Button>
      <a
        href="https://github.com/czl9707/nolli"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="ghost" className={styles.footerLink}>
            <Github size={16} />
            GitHub
        </Button>
      </a>
      <NavUser />
    </div>
  )
}