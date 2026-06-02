import { useMemo, useRef } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import { useLayoutStore } from "@/stores/layout"
import { useArchStore } from "@/stores/arch"
import {
  CANVAS_W,
  CANVAS_H,
  MAP_SLOT_W,
  MAP_SLOT_H,
  MAP_SLOT_X,
  MAP_SLOT_Y,
  layoutArchBoard,
} from "@/lib/pin-board-layout"
import { TRANSITION_SHORT, DELAY_START } from "@/lib/constants"
import { MapCore } from "@/components/map"
import { PinBoardItem } from "./pin-board-item"
import { Pin } from "@/components/ui/pin"
import { useBoardPan } from "./use-board-pan"
import styles from "./board.module.css"
import { useSidebarStore } from "@/stores/sidebar"

const EASE_TRANSITION = {
  duration: TRANSITION_SHORT,
  ease: "easeInOut" as const,
}

const SURFACE_VARIANTS = {
  home: {
    width: "100%",
    height: "100%",
  },
  board: {
    width: CANVAS_W,
    height: CANVAS_H,
  },
}

const MAP_SLOT_VARS = {
  "--size-container-width": `calc(100% - var(--spacing-component) * 2)`,
}
const MAP_SLOT_VARIANTS = {
  home: {
    top: "var(--size-header-height)",
    left: "var(--spacing-component)",
    width: `var(--size-container-width)`,
    height: `calc(100% - var(--size-header-height) - var(--size-footer-height))`,
    borderRadius: "var(--size-border-radius)",
    boxShadow: "none",
    borderWidth: 0,
  },
  homeSidebarOpen: {
    top: "var(--size-header-height)",
    left: "calc(var(--spacing-component) + var(--size-sidebar-width))",
    width: `calc(var(--size-container-width) - var(--size-sidebar-width))`,
    height: `calc(100% - var(--size-header-height) - var(--size-footer-height))`,
    borderRadius: "var(--size-border-radius)",
    boxShadow: "none",
    borderWidth: 0,
  },
  board: {
    top: MAP_SLOT_Y,
    left: MAP_SLOT_X,
    width: MAP_SLOT_W,
    height: MAP_SLOT_H,
    borderRadius: 0,
    boxShadow: "var(--shadow-sm)",
    borderWidth: 10,
  },
}

export function PinBoard() {
  const sideBarOpen = useSidebarStore((s) => s.sidebarOpen)
  const lastSelectedArch = useArchStore((s) => s.lastSelectedArch)
  const navigate = useNavigate()
  const viewportRef = useRef<HTMLDivElement>(null)
  
  const mode = useLayoutStore((s) => s.mode)
  const isBoard = mode === "board"
  const mapSlotVariant = sideBarOpen && !isBoard ? "homeSidebarOpen" : mode;

  const {
    panX,
    panY,
    zoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  } = useBoardPan(CANVAS_W, CANVAS_H, isBoard, viewportRef)

  const items = useMemo(() => {
    if (!lastSelectedArch) return []
    return layoutArchBoard(lastSelectedArch)
  }, [lastSelectedArch])

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onDragStart={(e) => e.preventDefault()}
    >
      <motion.div
        className={styles.surface}
        initial={mode}
        animate={mode}
        variants={SURFACE_VARIANTS}
        style={{ x: panX, y: panY, scale: zoom }}
      >
        {isBoard && <div className={styles.dotGrid} />}
        <motion.div
          className={styles.mapSlot}
          style={MAP_SLOT_VARS as React.CSSProperties}
          initial={mapSlotVariant}
          animate={mapSlotVariant}
          variants={MAP_SLOT_VARIANTS}
          transition={EASE_TRANSITION}
        >
          <MapCore />
          <AnimatePresence>
            {isBoard && (
              <motion.div
                key="map-overlay"
                className={styles.mapOverlay}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: DELAY_START + TRANSITION_SHORT },
                }}
                exit={{ opacity: 0 }}
                onClick={() => navigate("/")}
              >
                <span className={styles.overlayText}>
                  Click to go back to map view
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isBoard && (
            <Pin
              key="map-pin"
              id="site-map"
              delay={3}
              style={{
                top: MAP_SLOT_Y - 50,
                left: MAP_SLOT_X + MAP_SLOT_W / 2,
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isBoard &&
            lastSelectedArch &&
            items.map((item, i) => (
              <PinBoardItem key={`${item.kind}-${i}`} item={item} delay={i} />
            ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
