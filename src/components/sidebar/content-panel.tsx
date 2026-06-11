import { useState } from "react"
import { useSidebarStore } from "@/stores/sidebar"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayoutStore } from "@/stores/layout"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { TRANSITION_INSTANT, TRANSITION_SHORT } from "@/lib/constants"
import { OperationPanel } from "./operation-panel"
import { ArchSummary } from "./arch-summary"
import { useIsMobile } from "@/hooks/use-is-mobile"
import styles from "./content-panel.module.css"

// ── Desktop panel ──

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

function DesktopPanel() {
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const selectedArch = useArchDetailStore((s) => s.selected)
  const mode = useLayoutStore((s) => s.mode)

  const sidebarView = selectedArch ? "arch" : "panel"

  const [[view, direction], setView] = useState<
    [string, "forward" | "backward"]
  >([sidebarView, "forward"])

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
          initial={{ width: 0 }}
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

// ── Mobile bottom sheet ──

type SheetSnap = "peek" | "expanded" | "full"

const SNAP_HEIGHTS: Record<SheetSnap, string> = {
  peek: "4rem",
  expanded: "50vh",
  full: "90vh",
}

function getNearestSnap(y: number): SheetSnap {
  const vh = window.innerHeight
  const ratios: Record<SheetSnap, number> = {
    peek: (4 * 16) / vh,
    expanded: 0.5,
    full: 0.9,
  }
  const currentRatio = y / vh
  const clamped = Math.max(ratios.peek, Math.min(ratios.full, currentRatio))

  let nearest: SheetSnap = "expanded"
  let minDist = Infinity
  for (const [snap, ratio] of Object.entries(ratios)) {
    const dist = Math.abs(clamped - ratio)
    if (dist < minDist) {
      minDist = dist
      nearest = snap as SheetSnap
    }
  }
  return nearest
}

function MobileSheet() {
  const sheetState = useSidebarStore((s) => s.mobileSheetState)
  const setSheetState = useSidebarStore((s) => s.setMobileSheetState)
  const selectedArch = useArchDetailStore((s) => s.selected)
  const mode = useLayoutStore((s) => s.mode)

  // Don't render on board view
  if (mode === "board") return null

  const content = selectedArch ? <ArchSummary /> : <OperationPanel />
  const height = SNAP_HEIGHTS[sheetState]

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    const sheetEl = document.querySelector(
      `.${styles.sheetWrapper}`,
    ) as HTMLElement
    if (!sheetEl) return
    const currentY = sheetEl.getBoundingClientRect().top
    const snap = getNearestSnap(currentY)
    setSheetState(snap)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sheetState}
        className={styles.sheetWrapper}
        initial={{ height }}
        animate={{ height }}
        exit={{ height }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ height }}
      >
        <div className={styles.handleBar}>
          <div className={styles.handleIndicator} />
        </div>
        {sheetState === "peek" ? (
          <button
            className={styles.peekContent}
            onClick={() => setSheetState("expanded")}
          >
            {selectedArch ? "View details" : "Browse architectures"}
          </button>
        ) : (
          <div className={styles.sheetContent}>{content}</div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Self-contained export ──

/** Desktop: animated side panel. Mobile: draggable bottom sheet. */
export function ContentPanel() {
  const isMobile = useIsMobile()

  if (isMobile) return <MobileSheet />
  return <DesktopPanel />
}
