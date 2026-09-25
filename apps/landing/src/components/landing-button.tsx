// LandingButton — the ui Button's shape (data-slot/data-variant attrs,
// asChild via Slot) wearing the landing's pane-button skin, settled in the
// pane-button prototype round (2026-09-18): rest is a solid ground with
// the map's grass sheet showing through at half strength; hover fades the
// ground to transparent while the sheet stays (plain fades only). Accent
// rests amber, ghost skips the ground entirely. Typography is never
// assumed — labels arrive as a ui typography component from the consumer,
// and the button's own `color` drives label + decoration together.
import * as React from "react"
import { Slot } from "radix-ui"
import styles from "./landing-button.module.css"

function LandingButton({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "ghost" | "accent"
  size?: "default" | "pane"
  /** "bracket" adds the dropdown's corner L. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="landing-button"
      data-variant={variant}
      data-size={size}
      className={`${styles.button} ${className ?? ""}`}
      {...props}
    />
  )
}

export { LandingButton }
