import { useEffect, useRef } from "react"
import { useLocation } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_INSTANT } from "@nolli/ui"
import { useArchDetailStore } from "@/stores/arch-detail"
import { OperationPanel } from "./operational/operation-panel"
import { FavoritesPanel } from "./favorite/favorites-panel"
import { ArchSummary } from "./arch-summary/arch-summary"
import styles from "./index.module.css"

const contentVariants = {
  enter: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? -40 : 40,
    opacity: 0,
  }),
}

/** URL is the source of truth for panel mode. Selection (a deeper state) wins. */
export function SideBarContent() {
  const selectedArch = useArchDetailStore((s) => s.selected)
  const { pathname } = useLocation()

  const target = selectedArch
    ? "arch"
    : pathname === "/favorite"
      ? "favorite"
      : "filter"

  const prevRef = useRef<string>(target)
  useEffect(() => {
    prevRef.current = target
  }, [target])

  // Deeper states animate "forward". prevRef.current still holds the previous
  // target on this render (the ref is updated in the effect below), so this
  // reflects the actual direction of travel.
  const order: Record<string, number> = { filter: 0, favorite: 1, arch: 2 }
  const direction: "forward" | "backward" =
    order[target] >= order[prevRef.current] ? "forward" : "backward"

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={target}
        className={styles.panelContent}
        custom={direction}
        variants={contentVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: TRANSITION_INSTANT, ease: "easeInOut" }}
      >
        {target === "arch" ? (
          <ArchSummary />
        ) : target === "favorite" ? (
          <FavoritesPanel />
        ) : (
          <OperationPanel />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
