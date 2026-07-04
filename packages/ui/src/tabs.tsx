import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import styles from "./tabs.module.css"

/**
 * Tabs — translated from a Base UI + Tailwind reference to Radix + CSS module +
 * design tokens. Radix owns structure, keyboard nav, and `data-state`; the
 * module owns appearance (a filled "pill" list by default, or an underline
 * "line" variant).
 */
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={`${styles.tabs} ${className ?? ""}`}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: "default" | "line"
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={`${styles.list} ${className ?? ""}`}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={`${styles.trigger} ${className ?? ""}`}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={`${styles.content} ${className ?? ""}`}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
