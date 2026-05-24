import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { motion, useMotionValue, useTransform, AnimatePresence, animate } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Body2 } from "@/components/ui/typography"
import { MoveLeft } from "lucide-react"
import { useLayout } from "@/hooks/use-layout"
import { useSelectedArch } from "@/contexts/selected-arch"
import { layoutPinBoard, type PlacedItem, type ItemSpec } from "@/lib/pin-board-layout"
import { MapCore } from "@/components/map"
import { PhotoItem } from "./photo-item"
import { MetadataItem } from "./metadata-item"
import { NoteItem } from "./note-item"
import { LinkItem } from "./link-item"
import styles from "./board.module.css"

const CANVAS_W = 2400
const CANVAS_H = 1600
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.0
const MAP_SLOT_W = 400
const MAP_SLOT_H = 300
const MAP_SLOT_X = 60
const MAP_SLOT_Y = 60

const EASE_TRANSITION = { duration: 0.6, ease: "easeInOut" as const }

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
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: "0px",
    boxShadow: "0px 0px 0px rgba(0,0,0,0)",
  },
  board: {
    top: MAP_SLOT_Y,
    left: MAP_SLOT_X,
    width: MAP_SLOT_W,
    height: MAP_SLOT_H,
    borderRadius: "4px",
    boxShadow: "0px 1px 3px rgba(0,0,0,0.08), 0px 4px 12px rgba(0,0,0,0.06)",
  },
}

function buildBoardItemSpecs(arch: { photos: unknown[]; notes: unknown[] }): ItemSpec[] {
  const specs: ItemSpec[] = []

  // Reserve space for the map slot (collision avoidance only, not rendered as BoardItem)
  specs.push({ id: "site-map", width: MAP_SLOT_W, height: MAP_SLOT_H })

  for (let i = 0; i < arch.photos.length; i++) {
    specs.push({ id: `photo-${i}`, width: 340, height: 260 })
  }

  specs.push({ id: "metadata", width: 220, height: 200 })

  for (let i = 0; i < arch.notes.length; i++) {
    specs.push({ id: `note-${i}`, width: 200, height: 120 })
  }

  specs.push({ id: "links", width: 160, height: 160 })

  return specs
}

export function PinBoard() {
  const mode = useLayout()
  const { lastSelectedArch } = useSelectedArch()
  const navigate = useNavigate()
  const panX = useMotionValue(0)
  const panY = useMotionValue(0)
  const zoom = useMotionValue(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useMemo(() => ({ x: 0, y: 0 }), [])
  const isBoard = mode === "board"

  useEffect(() => {
    if (!isBoard) {
      animate(panX, 0, { duration: 0.6, ease: "easeInOut" })
      animate(panY, 0, { duration: 0.6, ease: "easeInOut" })
      animate(zoom, 1, { duration: 0.6, ease: "easeInOut" })
    }
  }, [isBoard, panX, panY, zoom])

  const items = useMemo(() => {
    if (!lastSelectedArch) return []
    const specs = buildBoardItemSpecs(lastSelectedArch)
    return layoutPinBoard(specs, CANVAS_W, CANVAS_H, "site-map")
  }, [lastSelectedArch])

  const transform = useTransform(
    [panX, panY, zoom],
    ([x, y, s]) => `translate(${x}px, ${y}px) scale(${s})`,
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isBoard) return
      if ((e.target as HTMLElement).closest("[data-pin-item]")) return
      setIsPanning(true)
      panStart.x = e.clientX - panX.get()
      panStart.y = e.clientY - panY.get()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [isBoard, panX, panY, panStart],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return
      panX.set(e.clientX - panStart.x)
      panY.set(e.clientY - panStart.y)
    },
    [isPanning, panX, panY, panStart],
  )

  const handlePointerUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!isBoard) return
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      zoom.set(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.get() + delta)))
    },
    [isBoard, zoom],
  )

  let delayIndex = 0

  return (
    <div
      className={`${styles.viewport} ${isBoard ? styles.boardMode : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <motion.div
        className={styles.surface}
        animate={mode}
        variants={SURFACE_VARIANTS}
        transition={EASE_TRANSITION}
        style={{ transform }}
      >
        <motion.div
          className={styles.mapSlot}
          animate={mode}
          variants={MAP_SLOT_VARIANTS}
          transition={EASE_TRANSITION}
        >
          <MapCore />
        </motion.div>

        <AnimatePresence>
          {isBoard &&
            lastSelectedArch &&
            items.map((item) => {
              if (item.id === "site-map") return null

              let content: React.ReactNode = null

              if (item.id === "metadata") {
                content = (
                  <MetadataItem
                    arch={lastSelectedArch}
                    item={item}
                    delay={delayIndex++}
                  />
                )
              } else if (item.id === "links") {
                content = (
                  <LinkItem
                    links={lastSelectedArch.links}
                    item={item}
                    delay={delayIndex++}
                  />
                )
              } else if (item.id.startsWith("photo-")) {
                const idx = parseInt(item.id.replace("photo-", ""), 10)
                content = (
                  <PhotoItem
                    photo={lastSelectedArch.photos[idx]}
                    item={item}
                    delay={delayIndex++}
                  />
                )
              } else if (item.id.startsWith("note-")) {
                const idx = parseInt(item.id.replace("note-", ""), 10)
                content = (
                  <NoteItem
                    note={lastSelectedArch.notes[idx]}
                    item={item}
                    delay={delayIndex++}
                  />
                )
              }

              return (
                <div key={item.id} data-pin-item>
                  {content}
                </div>
              )
            })}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isBoard && (
          <motion.div
            key="back-button"
            className={styles.backButton}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.6 } }}
            exit={{ opacity: 0 }}
          >
            <Button variant="link" onClick={() => navigate("/")}>
              <MoveLeft size={20} strokeWidth={1} />
              <Body2 style={{ fontFamily: "var(--font-playful)" }}>
                Back to map
              </Body2>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
