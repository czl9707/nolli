import * as React from "react"
import { Slot } from "radix-ui"
import styles from "./typography.module.css"

type TypographyProps<E extends React.ElementType> = React.ComponentProps<E> & {
  asChild?: boolean
}

function createTypography<E extends React.ElementType>(
  tag: E,
  variant: keyof typeof styles
) {
  return function TypographyComponent({
    className,
    asChild = false,
    ...props
  }: TypographyProps<E>) {
    const Comp = asChild ? Slot.Root : (tag as React.ElementType)

    return (
      <Comp
        className={`${styles[variant]} ${className ?? ""}`}
        {...props}
      />
    )
  }
}

// Two families: handwriting (--font-playful) where the app speaks, sans
// (--font-sans) where the user reads. Rule of thumb: if people must parse it,
// it's Body/Caption; if the app is saying it, it's H*/Note. The map and pin
// board are the exception — everything on those surfaces is playful, since
// they're poster views (the sidebar holds the readable copy).

// Playful headings — structure and page/panel titles.
const H1 = createTypography("h1", "h1") // standalone page title (static pages)
const H2 = createTypography("h2", "h2") // page-level section (submission form)
const H3 = createTypography("h3", "h3") // card title (pin-board building name)
const H4 = createTypography("h4", "h4") // subsection (terms/privacy headings)
const H5 = createTypography("h5", "h5") // panel titles + brand wordmarks
const H6 = createTypography("h6", "h6") // form section titles (DETAILS/PHOTOS/…)

// Sans body copy — the default for anything read.
const Body1 = createTypography("p", "body1") // primary reading text
const Body2 = createTypography("p", "body2") // secondary rows, bylines, button labels
const Body3 = createTypography("p", "body3") // dense lists, fine print
const Caption = createTypography("span", "caption") // small label attached to content (field labels, card foot, map markers)

// Playful ambient voice — empty states, hints. Never for text users act on;
// the moment it becomes operational, it graduates to Body/Caption.
const Note = createTypography("span", "note")

export { H1, H2, H3, H4, H5, H6, Body1, Body2, Body3, Caption, Note }
