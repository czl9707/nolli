import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"
import styles from "./board-modal.module.css"

export function BoardModal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  clipPath?: string
  tapeId?: string
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onClick={(e) => {
            onClose()
            e.stopPropagation();
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
