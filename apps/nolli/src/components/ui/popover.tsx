import * as React from "react"
import { Popover as Pop } from "radix-ui"
import styles from "./popover.module.css"

function Popover(props: React.ComponentProps<typeof Pop.Root>) {
  return <Pop.Root data-slot="popover" {...props} />
}

function PopoverTrigger(props: React.ComponentProps<typeof Pop.Trigger>) {
  return <Pop.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof Pop.Content>) {
  return (
    <Pop.Portal>
      <Pop.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={`${styles.content} ${className ?? ""}`}
        {...props}
      />
    </Pop.Portal>
  )
}

function PopoverAnchor(props: React.ComponentProps<typeof Pop.Anchor>) {
  return <Pop.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={`${styles.header} ${className ?? ""}`}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="popover-title"
      className={`${styles.title} ${className ?? ""}`}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={`${styles.description} ${className ?? ""}`}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
