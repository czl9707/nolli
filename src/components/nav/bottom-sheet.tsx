import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { useSidebarStore } from "@/stores/sidebar"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayoutStore } from "@/stores/layout"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { OperationPanel } from "@/components/sidebar/operation-panel"
import { ArchSummary } from "@/components/sidebar/arch-summary"
import styles from "./bottom-sheet.module.css"

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

export function BottomSheet() {
  const isMobile = useIsMobile()
  const sheetState = useSidebarStore((s) => s.mobileSheetState)
  const setSheetState = useSidebarStore((s) => s.setMobileSheetState)
  const selectedArch = useArchDetailStore((s) => s.selected)
  const mode = useLayoutStore((s) => s.mode)

  // Don't render on desktop or on board view
  if (!isMobile || mode === "board") return null

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
