import * as React from "react"
import { Slot } from "radix-ui"
import styles from "./typography.module.css"

type TypographyProps<E extends React.ElementType> = React.ComponentProps<E> & {
  asChild?: boolean
}

function createTypography<E extends React.ElementType>(
  tag: E,
  variant: string,
) {
  return function TypographyComponent({
    className,
    asChild = false,
    ...props
  }: TypographyProps<E>) {
    const Comp = asChild ? Slot.Root : (tag as React.ElementType)

    return (
      <Comp
        data-slot="typography"
        data-variant={variant}
        className={`${styles.root} ${className ?? ""}`}
        {...props}
      />
    )
  }
}

const H1 = createTypography("h1", "h1")
const H2 = createTypography("h2", "h2")
const H3 = createTypography("h3", "h3")
const H4 = createTypography("h4", "h4")
const H5 = createTypography("h5", "h5")
const H6 = createTypography("h6", "h6")
const Body1 = createTypography("p", "body1")
const Body2 = createTypography("p", "body2")

export { H1, H2, H3, H4, H5, H6, Body1, Body2 }
