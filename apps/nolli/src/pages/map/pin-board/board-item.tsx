import { motion, type MotionStyle } from "framer-motion"
import { useMemo, type ReactNode } from "react"
import type { Position } from "@/lib/pin-board-layout"
import { Pin } from "./pin"
import styles from "./board-item.module.css"
import paperStyles from "./paper-texture.module.css"
import { paperClipPath } from "@/lib/paper-clip"
import { TRANSITION_SHORT, DELAY_START, ITEM_STAGGER } from "@nolli/ui"

type BoardItemProps = {
  id?: string
  position: Position
  children: ReactNode
  delay?: number
  className?: string
  onClick?: () => void
}

export function BoardItem({
  id,
  position,
  children,
  delay = 0,
  className,
  onClick,
}: BoardItemProps) {
  const clipPath = useMemo(
    () => paperClipPath(id ?? ""),
    [id]
  )
  const motionStyle: MotionStyle = {
    clipPath,
    left: 0,
    top: 0,
    width: position.width,
    minHeight: position.height,
  }

  return (
    <div
      className={`${styles.shadowWrapper} ${onClick ? styles.clickable : ""}`}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        transform: `rotate(${position.rotation}deg)`,
      }}
      onClick={onClick}
    >
      <motion.div
        className={`${paperStyles.surface} ${styles.item} ${className ?? ""}`}
        style={motionStyle}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: {
            duration: TRANSITION_SHORT,
            delay: DELAY_START + delay * ITEM_STAGGER,
          },
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
          transition: { duration: TRANSITION_SHORT },
        }}
      >
        {children}
      </motion.div>
      <Pin id={id ?? ""} delay={delay} style={{ top: "-45px", left: "50%" }} />
    </div>
  )
}
