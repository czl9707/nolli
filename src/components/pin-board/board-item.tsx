import { motion, type MotionStyle } from "framer-motion"
import type { ReactNode } from "react"
import type { PlacedItem } from "@/lib/pin-board-layout"
import { Tape } from "./tape"
import styles from "./board-item.module.css"

type BoardItemProps = {
  item: PlacedItem
  children: ReactNode
  delay?: number
  className?: string
  style?: MotionStyle
}

export { paperClipPath } from "@/lib/paper-clip"

export function BoardItem({ item, children, delay = 0, className, style }: BoardItemProps) {
  const clipPath = style?.clipPath as string | undefined
  const motionStyle: MotionStyle = {
    left: 0,
    top: 0,
    width: item.width,
    minHeight: item.height,
    ...(clipPath ? { ...style, clipPath } : style),
  }

  return (
    <div
      className={styles.shadowWrapper}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        transform: `rotate(${item.rotation}deg)`,
      }}
    >
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
      <Tape id={item.id} delay={delay} className={styles.tape} />
    </div>
  )
}
