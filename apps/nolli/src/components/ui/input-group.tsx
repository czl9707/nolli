import * as React from "react"
import { Button } from "@nolli/ui"
import { Input } from "@/components/ui/input"
import styles from "./input-group.module.css"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={`${styles.inputGroup} ${className ?? ""}`}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end"
}) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={`${styles.inputGroupAddon} ${className ?? ""}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> & {
  size?: "xs" | "sm" | "icon-xs" | "icon-sm"
}) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={`${styles.inputGroupButton} ${className ?? ""}`}
      {...props}
    />
  )
}

function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={`${styles.inputGroupText} ${className ?? ""}`}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={`${styles.inputGroupInput} ${className ?? ""}`}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
}
