import { motion } from "framer-motion"
import type { CSSProperties, ReactNode } from "react"
import type { PlacedItem } from "@/lib/pin-board-layout"
import styles from "./board-item.module.css"

type BoardItemProps = {
  item: PlacedItem
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
}

// Deterministic jitter from a seed value
function jitter(seed: number, max: number): number {
  const x = Math.sin(seed * 10000 + 1) * 10000
  return ((x - Math.floor(x)) * 4 - 1) * max
}

export function paperClipPath(rotation: number): string {
  const j = 2
  const tl = `${jitter(rotation, j)}px ${jitter(rotation + 1, j)}px`
  const tr = `calc(100% + ${jitter(rotation + 2, j)}px) ${jitter(rotation + 3, j)}px`
  const br = `calc(100% + ${jitter(rotation + 4, j)}px) calc(100% + ${jitter(rotation + 5, j)}px)`
  const bl = `${jitter(rotation + 6, j)}px calc(100% + ${jitter(rotation + 7, j)}px)`
  return `polygon(${tl}, ${tr}, ${br}, ${bl})`
}

export function BoardItem({ item, children, delay = 0, className, style }: BoardItemProps) {
  return (
    <motion.div
      className={`${styles.item} ${className ?? ""}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        minHeight: item.height,
        rotate: item.rotation,
        ...style,
      }}
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
}
