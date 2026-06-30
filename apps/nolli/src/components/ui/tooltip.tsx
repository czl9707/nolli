import * as React from "react"
import { Tooltip as T } from "radix-ui"
import styles from "./tooltip.module.css"
import { Body2 } from "@nolli/ui"

function TooltipProvider({ delayDuration = 0, ...props}: React.ComponentProps<typeof T.Provider>) {
  return <T.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
}

function Tooltip(props: React.ComponentProps<typeof T.Root>) {
  return <T.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger(props: React.ComponentProps<typeof T.Trigger>) {
  return <T.Trigger data-slot="tooltip-trigger" asChild {...props} />
}

function TooltipContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof T.Content>) {
  return (
    <T.Portal>
      <T.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={`${styles.content} ${className ?? ""}`}
        {...props}
      >
        <Body2>
          {children}
        </Body2>
        <T.Arrow className={styles.arrow} />
      </T.Content>
    </T.Portal>
  )
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }
