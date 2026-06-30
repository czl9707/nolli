import * as React from "react"
import { CheckIcon, ChevronRightIcon } from "lucide-react"
import { DropdownMenu as DM } from "radix-ui"
import { Body2, Caption } from "@nolli/ui"
import styles from "./dropdown-menu.module.css"

function DropdownMenu(props: React.ComponentProps<typeof DM.Root>) {
  return <DM.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal(props: React.ComponentProps<typeof DM.Portal>) {
  return <DM.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DM.Trigger>) {
  return (
    <DM.Trigger
      data-slot="dropdown-menu-trigger"
      className={className}
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={`${styles.content} ${className ?? ""}`}
        {...props}
      />
    </DM.Portal>
  )
}

function DropdownMenuGroup(props: React.ComponentProps<typeof DM.Group>) {
  return <DM.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DM.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <Body2 asChild>
      <DM.Item
        data-slot="dropdown-menu-item"
        data-inset={inset}
        data-variant={variant}
        className={`${styles.item} ${className ?? ""}`}
        {...props}
      />
    </Body2>
  )
}

function DropdownMenuCheckboxItem({
  className,
  checked,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DM.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <Body2 asChild>
      <DM.CheckboxItem
        data-slot="dropdown-menu-checkbox-item"
        data-inset={inset}
        className={`${styles.checkboxItem} ${className ?? ""}`}
        checked={checked}
        {...props}
      >
        <span
          className={styles.checkIndicator}
          data-slot="dropdown-menu-checkbox-item-indicator"
        >
          <DM.ItemIndicator>
            <CheckIcon />
          </DM.ItemIndicator>
        </span>
        {children}
      </DM.CheckboxItem>
    </Body2>
  )
}

function DropdownMenuRadioGroup(props: React.ComponentProps<typeof DM.RadioGroup>) {
  return <DM.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DM.RadioItem> & {
  inset?: boolean
}) {
  return (
    <Body2 asChild>
      <DM.RadioItem
        data-slot="dropdown-menu-radio-item"
        data-inset={inset}
        className={`${styles.radioItem} ${className ?? ""}`}
        {...props}
      >
        <span
          className={styles.checkIndicator}
          data-slot="dropdown-menu-radio-item-indicator"
        >
          <DM.ItemIndicator>
            <CheckIcon />
          </DM.ItemIndicator>
        </span>
        {children}
      </DM.RadioItem>
    </Body2>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DM.Label> & {
  inset?: boolean
}) {
  return (
    <Caption asChild>
      <DM.Label
        data-slot="dropdown-menu-label"
        data-inset={inset}
        className={`${styles.label} ${className ?? ""}`}
        {...props}
      />
    </Caption>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DM.Separator>) {
  return (
    <DM.Separator
      data-slot="dropdown-menu-separator"
      className={`${styles.separator} ${className ?? ""}`}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <Caption
      data-slot="dropdown-menu-shortcut"
      className={`${styles.shortcut} ${className ?? ""}`}
      {...props}
    />
  )
}

function DropdownMenuSub(props: React.ComponentProps<typeof DM.Sub>) {
  return <DM.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DM.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <Body2 asChild>
      <DM.SubTrigger
        data-slot="dropdown-menu-sub-trigger"
        data-inset={inset}
        className={`${styles.subTrigger} ${className ?? ""}`}
        {...props}
      >
        {children}
        <ChevronRightIcon className={styles.subTriggerChevron} />
      </DM.SubTrigger>
    </Body2>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DM.SubContent>) {
  return (
    <DM.SubContent
      data-slot="dropdown-menu-sub-content"
      className={`${styles.subContent} ${className ?? ""}`}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
