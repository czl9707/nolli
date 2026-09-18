// LandingButton — the ui Button's shape (data-slot/data-variant attrs,
// asChild via Slot) wearing the landing's pane-button skin, settled in the
// pane-button prototype round (2026-09-18): rest is a solid ground with
// the map's grass sheet showing through at half strength; hover fades the
// ground to transparent while the sheet stays (plain fades only). Accent
// rests amber, ghost skips the ground entirely. Typography is never
// assumed — labels arrive as a ui typography component from the consumer,
// and the button's own `color` drives label + decoration together.
// The bracket decoration (dropdown affordance) is a small L resting at the
// bottom-right that travels to the top-left on hover or open — radix
// triggers put data-state="open" on the button, which the css keys on.
// Layer stack: ground = background-color, grass sheet = ::before, bracket
// = ::after — children pass straight through, so asChild stays a true
// single-child Slot.
import * as React from "react"
import { Slot } from "radix-ui"
import styles from "./landing-button.module.css"

function LandingButton({
  className,
  variant = "default",
  size = "default",
  decoration = false,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "ghost" | "accent"
  size?: "default" | "pane"
  /** "bracket" adds the dropdown's corner L. */
  decoration?: boolean
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="landing-button"
      data-variant={variant}
      data-size={size}
      className={`${styles.button} ${decoration ? styles.buttonDecoration : ""} ${className ?? ""}`}
      {...props}
    />
  )
}

export { LandingButton }
