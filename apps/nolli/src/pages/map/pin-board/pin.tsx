import { motion } from "framer-motion"
import type { CSSProperties } from "react"
import { hashId, jitter } from "@/lib/paper-clip"
import { TRANSITION_SHORT, DELAY_START, ITEM_STAGGER } from "@nolli/ui"
import styles from "./pin.module.css"

type PinProps = {
  id?: string
  delay?: number
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

export function Pin({ id, delay = 0, className, style, onClick }: PinProps) {
  const s = hashId(id ?? "")
  const rotation = jitter(s + 100, 40) - 20
  const scale = (0.8 + jitter(s + 200, 0.4)) * 0.35

  return (
    <motion.img
      src="/images/pin.png"
      className={`${className} ${styles.pin}`}
      style={{
        transform: `translateX(-50%) rotate(${rotation}deg) scale(${scale})`,
        ...style,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: {
          duration: TRANSITION_SHORT,
          delay: DELAY_START + delay * ITEM_STAGGER,
        },
      }}
      exit={{ opacity: 0 }}
      onClick={onClick}
    />
  )
}
