import * as React from "react"
import { Command as Cmd } from "cmdk"
import { CheckIcon, SearchIcon } from "lucide-react"
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group"
import styles from "./command.module.css"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof Cmd>) {
  return (
    <Cmd
      data-slot="command"
      className={`${styles.command} ${className ?? ""}`}
      {...props}
    />
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof Cmd.Input>) {
  return (
    <div data-slot="command-input-wrapper" className={styles.inputWrapper}>
      <InputGroup className={styles.inputGroup}>
        <Cmd.Input
          data-slot="command-input"
          className={`${styles.input} ${className ?? ""}`}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className={styles.searchIcon} />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof Cmd.List>) {
  return (
    <Cmd.List
      data-slot="command-list"
      className={`${styles.list} ${className ?? ""}`}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof Cmd.Empty>) {
  return (
    <Cmd.Empty
      data-slot="command-empty"
      className={`${styles.empty} ${className ?? ""}`}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof Cmd.Group>) {
  return (
    <Cmd.Group
      data-slot="command-group"
      className={`${styles.group} ${className ?? ""}`}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Cmd.Separator>) {
  return (
    <Cmd.Separator
      data-slot="command-separator"
      className={`${styles.separator} ${className ?? ""}`}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Cmd.Item>) {
  return (
    <Cmd.Item
      data-slot="command-item"
      className={`${styles.item} ${className ?? ""}`}
      {...props}
    >
      {children}
      <CheckIcon className={styles.checkIcon} />
    </Cmd.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={`${styles.shortcut} ${className ?? ""}`}
      {...props}
    />
  )
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
}
