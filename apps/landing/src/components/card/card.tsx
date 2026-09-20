// Card — the landing's surface primitive, replacing the pane fills of the
// old grid system. Surface only: ground + radius per variant (solid |
// outline | vellum). Sizing, padding, and the docked-inner offset pattern
// (outer radius X, inner docked piece inset Y with radius X−Y) are wired
// per scene with the --card-* tokens.
import * as React from "react"
import styles from "./card.module.css"

function Card({
  variant = "solid",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "solid" | "outline" | "vellum"
}) {
  return <div data-variant={variant} {...props} className={`${styles.card} ${props.className ?? ""}`} />
}

export { Card }
