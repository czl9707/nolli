import { motion, type MotionStyle } from "framer-motion"
import type { ReactNode } from "react"
import type { PlacedItem } from "@/lib/pin-board-layout"
import styles from "./board-item.module.css"

type BoardItemProps = {
  item: PlacedItem
  children: ReactNode
  delay?: number
  className?: string
  style?: MotionStyle
}

// Deterministic positive jitter from a seed value (0 to max)
function jitter(seed: number, max: number): number {
  const x = Math.sin(seed * 10000 + 1) * 10000
  return (x - Math.floor(x)) * max
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0
  }
  return h
}

// Inward-only clip-path: each corner jitters toward center
export function paperClipPath(id: string): string {
  const s = hashId(id)
  const j = 5
  const tl = `${jitter(s, j)}px ${jitter(s + 1, j)}px`
  const tr = `calc(100% - ${jitter(s + 2, j)}px) ${jitter(s + 3, j)}px`
  const br = `calc(100% - ${jitter(s + 4, j)}px) calc(100% - ${jitter(s + 5, j)}px)`
  const bl = `${jitter(s + 6, j)}px calc(100% - ${jitter(s + 7, j)}px)`
  return `polygon(${tl}, ${tr}, ${br}, ${bl})`
}

export function BoardItem({ item, children, delay = 0, className, style }: BoardItemProps) {
  const clipPath = style?.clipPath as string | undefined
  const motionStyle: MotionStyle = {
    left: item.x,
    top: item.y,
    width: item.width,
    minHeight: item.height,
    rotate: item.rotation,
    ...(clipPath ? { ...style, clipPath } : style),
  }

  const inner = (
    <motion.div
      className={`${styles.item} ${className ?? ""}`}
      style={motionStyle}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, delay: 0.3 + delay * 0.1 },
      }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
    >
      {children}
    </motion.div>
  )

  if (!clipPath) return inner

  return (
    <div className={styles.shadowWrapper}>
      {inner}
    </div>
  )
}
