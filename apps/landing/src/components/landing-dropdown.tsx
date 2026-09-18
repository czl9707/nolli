// LandingDropdown — the ui DropdownMenu's shape (radix DM.* wrappers,
// same export surface) reusing LandingButton: the trigger IS a
// LandingButton with the bracket decoration, and so is every plain item —
// ghost buttons stacked edge to edge under hairline separators.
import * as React from "react"
import { CheckIcon, ChevronRightIcon } from "lucide-react"
import { DropdownMenu as DM } from "radix-ui"
import { Caption } from "@nolli/ui"
import { LandingButton } from "./landing-button"
import styles from "./landing-dropdown.module.css"

function LandingDropdown(props: React.ComponentProps<typeof DM.Root>) {
  return <DM.Root data-slot="landing-dropdown" {...props} />
}

function LandingDropdownPortal(props: React.ComponentProps<typeof DM.Portal>) {
  return <DM.Portal data-slot="landing-dropdown-portal" {...props} />
}

function LandingDropdownTrigger({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof DM.Trigger> & {
  variant?: "default" | "ghost" | "accent"
  size?: "default" | "pane"
}) {
  return (
    <DM.Trigger asChild {...props}>
      <LandingButton variant={variant} size={size} decoration className={className}>
        {children}
      </LandingButton>
    </DM.Trigger>
  )
}

function LandingDropdownContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        data-slot="landing-dropdown-content"
        sideOffset={sideOffset}
        align={align}
        className={`${styles.content} ${className ?? ""}`}
        {...props}
      />
    </DM.Portal>
  )
}

function LandingDropdownGroup(props: React.ComponentProps<typeof DM.Group>) {
  return <DM.Group data-slot="landing-dropdown-group" {...props} />
}

function LandingDropdownItem({
  className,
  variant = "ghost",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<typeof DM.Item> & {
  variant?: "default" | "ghost" | "accent"
  asChild?: boolean
}) {
  return (
    <DM.Item asChild {...props}>
      <LandingButton variant={variant} asChild={asChild} className={className}>
        {children}
      </LandingButton>
    </DM.Item>
  )
}

function LandingDropdownLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DM.Label> & {
  inset?: boolean
}) {
  return (
    <Caption
      data-slot="landing-dropdown-label"
      data-inset={inset}
      className={`${styles.label} ${className ?? ""}`}
      {...props}
    />
  )
}

function LandingDropdownSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DM.Separator>) {
  return (
    <DM.Separator
      data-slot="landing-dropdown-separator"
      className={`${styles.separator} ${className ?? ""}`}
      {...props}
    />
  )
}

export {
  LandingDropdown,
  LandingDropdownPortal,
  LandingDropdownTrigger,
  LandingDropdownContent,
  LandingDropdownGroup,
  LandingDropdownLabel,
  LandingDropdownItem,
  LandingDropdownSeparator,
}
