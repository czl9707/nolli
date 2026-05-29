import { useMemo, useRef } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "framer-motion"
import { useLayout } from "@/hooks/use-layout"
import { useSelectedArch } from "@/contexts/selected-arch"
import { layoutPinBoard, type ItemSpec } from "@/lib/pin-board-layout"
import { CANVAS_W, CANVAS_H, MAP_SLOT_W, MAP_SLOT_H, MAP_SLOT_X, MAP_SLOT_Y, BOARD_GAP } from "@/lib/pin-board-config"
import { TRANSITION_SHORT, DELAY_START } from "@/lib/animation"
import { MapCore } from "@/components/map"
import { PinBoardItem } from "./pin-board-item"
import { Tape } from "./tape"
import { useBoardPan } from "./use-board-pan"
import styles from "./board.module.css"

const EASE_TRANSITION = { duration: TRANSITION_SHORT, ease: "easeInOut" as const }

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

const MAP_SLOT_VARIANTS = {
  home: {
    top: "var(--size-header-height)",
    left: "var(--spacing-component)",
    width: `calc(100% - var(--spacing-component) * 2)`,
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
    boxShadow: "var(--shadow-md)",
    borderWidth: 10,
  },
}

function clampDimensions(width: number, height: number, max = 500, min = 300) {
  if (Math.max(width, height) > max) {
    const s = max / Math.max(width, height)
    width *= s
    height *= s
  } else if (Math.min(width, height) < min) {
    const s = min / Math.min(width, height)
    if (Math.max(width, height) * s <= max) {
      width *= s
      height *= s
    }
  }
  return { width, height }
}

function buildBoardItemSpecs(arch: { photos: { width: number; height: number }[]; notes: unknown[] }): ItemSpec[] {
  const specs: ItemSpec[] = []

  specs.push({ id: "site-map", width: MAP_SLOT_W, height: MAP_SLOT_H })
  specs.push({ id: "metadata", width: 420, height: 200 })
  specs.push({ id: "links", width: 240, height: 360 })

  for (let i = 0; i < arch.notes.length; i++) {
    specs.push({ id: `note-${i}`, width: 240, height: 180 })
  }

  for (let i = 0; i < arch.photos.length; i++) {
    const photo = arch.photos[i]
    const { width, height } = clampDimensions(photo.width, photo.height)
    specs.push({ id: `photo-${i}`, width, height })
  }
  return specs
}

export function PinBoard() {
  const mode = useLayout()
  const isBoard = mode === "board"
  const { lastSelectedArch } = useSelectedArch()
  const navigate = useNavigate()
  const viewportRef = useRef<HTMLDivElement>(null)

  const { panX, panY, zoom, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel } =
    useBoardPan(CANVAS_W, CANVAS_H, isBoard, viewportRef)

  const items = useMemo(() => {
    if (!lastSelectedArch) return []
    const specs = buildBoardItemSpecs(lastSelectedArch)
    return layoutPinBoard(specs, CANVAS_W, CANVAS_H, "site-map", BOARD_GAP, MAP_SLOT_X, MAP_SLOT_Y)
  }, [lastSelectedArch])

  return (
    <div
      ref={viewportRef}
      className={`${styles.viewport} ${isBoard ? styles.boardMode : ""}`}
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
        transition={EASE_TRANSITION}
        style={{ x: panX, y: panY, scale: zoom }}
      >
        {isBoard && <div className={styles.dotGrid} />}
        <motion.div
          className={styles.mapSlot}
          initial={mode}
          animate={mode}
          variants={MAP_SLOT_VARIANTS}
          transition={EASE_TRANSITION}
        >
          <MapCore/>
          <AnimatePresence>
            {isBoard && (
              <motion.div
                key="map-overlay"
                className={styles.mapOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: DELAY_START + TRANSITION_SHORT } }}
                exit={{ opacity: 0 }}
                onClick={() => navigate("/")}
              >
                <span className={styles.overlayText}>Click to go back to map view</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isBoard && (
            <Tape
              key="map-tape"
              id="site-map"
              delay={3}
              style={{
                position: "absolute",
                top: MAP_SLOT_Y - 20,
                left: MAP_SLOT_X + MAP_SLOT_W / 2,
                width: 80,
                pointerEvents: "none",
                zIndex: 20,
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isBoard &&
            lastSelectedArch &&
            items
              .filter((item) => item.id !== "site-map")
              .map((item, i) => (
                <PinBoardItem
                  key={item.id}
                  item={item}
                  arch={lastSelectedArch}
                  delay={i}
                />
              ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
