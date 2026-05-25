import { motion } from "framer-motion"
import type { CSSProperties } from "react"
import { hashId, jitter } from "@/lib/paper-clip"

type TapeProps = {
  id: string
  delay?: number
  className?: string
  style?: CSSProperties
}

export function Tape({ id, delay = 0, className, style }: TapeProps) {
  const s = hashId(id)
  const rotation = jitter(s + 100, 40) - 20
  const scale = 0.8 + jitter(s + 200, 0.4)

  return (
    <motion.img
      src="/images/tape.png"
      className={className}
      style={{
        transform: `translateX(-50%) rotate(${rotation}deg) scale(${scale})`,
        ...style,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.3 + delay * 0.1 } }}
      exit={{ opacity: 0 }}
    />
  )
}
