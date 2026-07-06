import { useEffect, type ReactNode } from "react"
import { useSidebarStore } from "@/stores/sidebar"
import { useLayout } from "@/hooks/use-layout"
import {
  motion,
  useMotionValue,
  animate,
  useMotionValueEvent,
  type PanInfo,
  AnimatePresence,
} from "framer-motion"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { TRANSITION_SHORT, TRANSITION_INSTANT } from "@nolli/ui"
import styles from "./index.module.css"
import { useLocation } from "react-router"

// ── Desktop: animated side panel ──

function DesktopPanel({ children }: { children: ReactNode }) {
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const { isMap } = useLayout()
  const isOpen = isMap && sidebarOpen

  // AnimatePresence must stay mounted (no early return) so it can run the
  // exit animation. `initial={false}` skips the mount-time grow so the panel
  // shows at full width on app start; later open/close still animate.
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sidebar"
          className={styles.sidebarOuter}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "var(--size-sidebar-width)", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
        >
          <div className={styles.panelWrapper}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
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
    expanded: vh * 0.5, // 90vh − 50vh = 40vh
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
  const setSheetY = useSidebarStore((s) => s.setSheetY)
  const { isBoard } = useLayout()

  const offsets = getSnapOffsets()

  const y = useMotionValue(offsets[sheetState])

  useMotionValueEvent(y, "change", (v) => {
    setSheetY(window.innerHeight - v)
  })

  useEffect(() => {
    setSheetY(window.innerHeight - y.get())
  }, [y, setSheetY])

  useEffect(() => {
    const controls = animate(y, getSnapOffsets()[sheetState], {
      duration: TRANSITION_INSTANT,
      ease: "easeInOut",
    })
    return () => controls.stop()
  }, [sheetState, y])

  // Don't render on board view
  if (isBoard) return null

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    const sheetEl = document.querySelector(
      `.${styles.sheetWrapper}`
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
      style={{ y }}
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
export function SideBar({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const { pathname } = useLocation();
  const setSidebarOpen = useSidebarStore((s) => s.setOpen);

  useEffect(() => {
    if (pathname === "/favorite" || pathname.startsWith("/arch/")) {
      setSidebarOpen(true)
    }
  }, [pathname])

  if (isMobile) return <MobileSheet>{children}</MobileSheet>
  return <DesktopPanel>{children}</DesktopPanel>
}
