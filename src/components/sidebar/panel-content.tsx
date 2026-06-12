import { useState } from "react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_INSTANT } from "@/lib/constants"
import { OperationPanel } from "./operation-panel"
import { ArchSummary } from "./arch-summary"
import styles from "./content-panel.module.css"

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

/** Switches between OperationPanel and ArchSummary with animated transitions */
export function PanelContent() {
  const selectedArch = useArchDetailStore((s) => s.selected)
  const panelView = selectedArch ? "arch" : "panel"

  const [[view, direction], setView] = useState<
    [string, "forward" | "backward"]
  >([panelView, "forward"])

  if (view !== panelView) {
    setView([panelView, panelView === "arch" ? "forward" : "backward"])
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={view}
        className={styles.panelContent}
        custom={direction}
        variants={contentVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: TRANSITION_INSTANT, ease: "easeInOut" }}
      >
        {panelView === "arch" ? <ArchSummary /> : <OperationPanel />}
      </motion.div>
    </AnimatePresence>
  )
}
