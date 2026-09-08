// RollButton — the landing spine's shared cell. Pure UI: the caller owns the
// state, this owns the faces and the roll. Three faces: default rides the
// building tile with a dim label, focused clears the fill to full color,
// active takes the accent ground (hero CTA look). One children renders on
// every face — the ground is the swap; typography comes in with the
// children.
import { type ComponentPropsWithoutRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { TRANSITION_SHORT } from "@nolli/ui"
import { ROLL_EASE } from "@/lib/constants"
import { Pane } from "@/scenes/grid"
import styles from "./roll-button.module.css"

export type RollButtonState = "default" | "focused" | "active"

export function RollButton({
  state,
  onClick,
  disabled = false,
  className,
  size,
  children,
  ...rest
}: {
  state: RollButtonState
  onClick?: () => void
  disabled?: boolean
  /** Absorbed from Pane — declares the cell's size in the split when given. */
  size?: string
  children?: React.ReactNode
} & ComponentPropsWithoutRef<"div">) {
  const reduced = useReducedMotion()
  return (
    <Pane size={size}>
      <div
        className={[styles.button, className].filter(Boolean).join(" ")}
        data-state={state}
        data-disabled={disabled || undefined}
        role="button"
        tabIndex={disabled ? -1 : 0}
        {...rest}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick?.()
          }
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={state}
            className={styles.face}
            data-state={state}
            initial={reduced ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduced ? undefined : { y: "-100%" }}
            transition={{ duration: TRANSITION_SHORT, ease: ROLL_EASE }}
          >
            {children}
          </motion.span>
        </AnimatePresence>
      </div>
    </Pane>
  )
}
