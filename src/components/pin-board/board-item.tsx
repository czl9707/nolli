import { motion } from "framer-motion"
import type { ReactNode } from "react"
import type { PlacedItem } from "@/lib/pin-board-layout"
import styles from "./board-item.module.css"

type BoardItemProps = {
  item: PlacedItem
  children: ReactNode
  delay?: number
  className?: string
}

export function BoardItem({ item, children, delay = 0, className }: BoardItemProps) {
  return (
    <motion.div
      className={`${styles.item} ${className ?? ""}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        rotate: item.rotation,
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
