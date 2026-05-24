import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Body2 } from "@/components/ui/typography"
import { MoveLeft } from "lucide-react"
import type { Arch } from "@/lib/data/architectures"
import { layoutPinBoard, type PlacedItem, type ItemSpec } from "@/lib/pin-board-layout"
import { PhotoItem } from "./photo-item"
import { MetadataItem } from "./metadata-item"
import { NoteItem } from "./note-item"
import { LinkItem } from "./link-item"
import { SiteMapItem } from "./site-map-item"
import styles from "./board.module.css"

const CANVAS_W = 2400
const CANVAS_H = 1600
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.0

function buildItemSpecs(arch: Arch): ItemSpec[] {
  const specs: ItemSpec[] = []

  specs.push({ id: "site-map", width: 400, height: 300 })

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

type PinBoardProps = {
  arch: Arch
}

export function PinBoard({ arch }: PinBoardProps) {
  const navigate = useNavigate()
  const panX = useMotionValue(0)
  const panY = useMotionValue(0)
  const zoom = useMotionValue(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useMemo(() => ({ x: 0, y: 0 }), [])

  const items = useMemo(() => {
    const specs = buildItemSpecs(arch)
    return layoutPinBoard(specs, CANVAS_W, CANVAS_H, "site-map")
  }, [arch])

  const transform = useTransform(
    [panX, panY, zoom],
    ([x, y, s]) => `translate(${x}px, ${y}px) scale(${s})`
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-pin-item]")) return
      setIsPanning(true)
      panStart.x = e.clientX - panX.get()
      panStart.y = e.clientY - panY.get()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [panX, panY, panStart],
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
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      zoom.set(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.get() + delta)))
    },
    [zoom],
  )

  const findItem = (id: string): PlacedItem =>
    items.find((i) => i.id === id) ?? items[0]

  let delayIndex = 0

  return (
    <div
      className={styles.viewport}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <motion.div
        className={styles.surface}
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform,
        }}
      >
        <AnimatePresence>
          {items.map((item) => {
            let content: React.ReactNode = null

            if (item.id === "site-map") {
              content = <SiteMapItem item={item} />
            } else if (item.id === "metadata") {
              content = <MetadataItem arch={arch} item={item} delay={delayIndex++} />
            } else if (item.id === "links") {
              content = <LinkItem links={arch.links} item={item} delay={delayIndex++} />
            } else if (item.id.startsWith("photo-")) {
              const idx = parseInt(item.id.replace("photo-", ""), 10)
              content = <PhotoItem photo={arch.photos[idx]} item={item} delay={delayIndex++} />
            } else if (item.id.startsWith("note-")) {
              const idx = parseInt(item.id.replace("note-", ""), 10)
              content = <NoteItem note={arch.notes[idx]} item={item} delay={delayIndex++} />
            }

            return <div key={item.id} data-pin-item>{content}</div>
          })}
        </AnimatePresence>
      </motion.div>

      <div className={styles.backButton}>
        <Button variant="link" onClick={() => navigate("/")}>
          <MoveLeft size={20} strokeWidth={1} />
          <Body2 style={{ fontFamily: "var(--font-playful)" }}>Back to map</Body2>
        </Button>
      </div>
    </div>
  )
}
