import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"
import { TRANSITION_SHORT } from "@/lib/constants"
import styles from "./board-modal.module.css"
import paperStyles from "./paper-texture.module.css"

export function BoardModal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: TRANSITION_SHORT }}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onClick={(e) => {
            onClose()
            e.stopPropagation()
          }}
        >
          <div className={paperStyles.surface}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
