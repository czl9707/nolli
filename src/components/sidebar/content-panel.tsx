import type { ReactNode } from "react"
import { useSidebarStore } from "@/stores/sidebar"
import { useLayoutStore } from "@/stores/layout"
import { motion, type PanInfo } from "framer-motion"
import { useIsMobile } from "@/hooks/use-is-mobile"
import styles from "./content-panel.module.css"

// ── Desktop: animated side panel ──

function DesktopPanel({ children }: { children: ReactNode }) {
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const mode = useLayoutStore((s) => s.mode)
  const isOpen = mode === "home" && sidebarOpen

  // Can't use AnimatePresence here without wrapping in a component
  // that reads the store, so we use CSS transition via motion
  if (!isOpen) return null

  return (
    <motion.div
      key="sidebar"
      className={styles.sidebarOuter}
      initial={{ width: 0 }}
      animate={{ width: "var(--size-sidebar-width)" }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        className={styles.panelWrapper}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// ── Mobile: draggable bottom sheet (content always rendered) ──

type SheetSnap = "peek" | "expanded" | "full"

/** Offset = how far DOWN to translateY from rest position.
 *  Sheet is `position: fixed; bottom: 0; height: 90vh`.
 *  At rest (translateY=0): top at 10vh, fully visible.
 *  At peek: translateY pushes top to 100vh-4rem → 4rem visible at bottom.
 */
function getSnapOffsets(): Record<SheetSnap, number> {
  const vh = window.innerHeight
  return {
    peek: vh * 0.9, // 90vh − 4rem
    expanded: vh * 0.5,        // 90vh − 50vh = 40vh
    full: vh * 0.1,
  }
}

function getNearestSnap(topPx: number): SheetSnap {
  const vh = window.innerHeight
  const visibleRatio = (vh - topPx) / vh // fraction of viewport covered
  const ratios: Record<SheetSnap, number> = {
    peek: (4 * 16) / vh,
    expanded: 0.5,
    full: 0.9,
  }
  const clamped = Math.max(ratios.peek, Math.min(ratios.full, visibleRatio))

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

function MobileSheet({ children }: { children: ReactNode }) {
  const sheetState = useSidebarStore((s) => s.mobileSheetState)
  const setSheetState = useSidebarStore((s) => s.setMobileSheetState)
  const mode = useLayoutStore((s) => s.mode)

  // Don't render on board view
  if (mode === "board") return null

  const offsets = getSnapOffsets()
  const currentOffset = offsets[sheetState]

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    const sheetEl = document.querySelector(
      `.${styles.sheetWrapper}`,
    ) as HTMLElement
    if (!sheetEl) return
    const topY = sheetEl.getBoundingClientRect().top
    const snap = getNearestSnap(topY)
    setSheetState(snap)
  }

  function handleHandleClick() {
    setSheetState(sheetState === "peek" ? "expanded" : "peek")
  }

  return (
    <motion.div
      className={styles.sheetWrapper}
      animate={{ y: currentOffset }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      drag="y"
      dragConstraints={{ top: offsets.full, bottom: offsets.peek }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.handleBar} onClick={handleHandleClick}>
        <div className={styles.handleIndicator} />
      </div>
      <div className={styles.sheetContent}>{children}</div>
    </motion.div>
  )
}

// ── Self-contained export ──

/** Generic container: desktop side panel or mobile bottom sheet.
 *  Accepts children — the consumer controls what's rendered inside. */
export function ContentPanel({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()

  if (isMobile) return <MobileSheet>{children}</MobileSheet>
  return <DesktopPanel>{children}</DesktopPanel>
}
