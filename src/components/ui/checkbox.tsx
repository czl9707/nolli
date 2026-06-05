import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CB } from "radix-ui"
import styles from "./checkbox.module.css"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CB.Root>) {
  return (
    <CB.Root
      data-slot="checkbox"
      className={`${styles.checkbox} ${className ?? ""}`}
      {...props}
    >
      <CB.Indicator
        data-slot="checkbox-indicator"
        className={styles.indicator}
      >
        <CheckIcon />
      </CB.Indicator>
    </CB.Root>
  )
}

export { Checkbox }
