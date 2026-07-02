import * as React from "react"
import { Slot } from "radix-ui"
import styles from "./badge.module.css"

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={`${styles.badge} ${className ?? ""}`}
      {...props}
    />
  )
}

export { Badge }
