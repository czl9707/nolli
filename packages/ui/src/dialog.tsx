import * as React from "react"
import { X } from "lucide-react"
import { Dialog as RadixDialog } from "radix-ui"
import styles from "./dialog.module.css"
import { Button } from "./button"
import { Body2, H5 } from "./typography"

function Dialog(props: React.ComponentProps<typeof RadixDialog.Root>) {
  return <RadixDialog.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof RadixDialog.Trigger>) {
  return <RadixDialog.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: React.ComponentProps<typeof RadixDialog.Portal>) {
  return <RadixDialog.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(props: React.ComponentProps<typeof RadixDialog.Close>) {
  return <RadixDialog.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof RadixDialog.Overlay>) {
  return (
    <RadixDialog.Overlay
      data-slot="dialog-overlay"
      forceMount
      className={`${styles.overlay} ${className ?? ""}`}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof RadixDialog.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        data-slot="dialog-content"
        forceMount
        className={`${styles.content} ${className ?? ""}`}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" className={styles.closeButton}>
              <X />
              <span className={styles.srOnly}>Close</span>
            </Button>
          </DialogClose>
        )}
      </RadixDialog.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={`${styles.header} ${className ?? ""}`}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={`${styles.footer} ${className ?? ""}`}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof RadixDialog.Title>) {
  return (
    <H5 asChild>
      <RadixDialog.Title
        data-slot="dialog-title"
        className={`${styles.title} ${className ?? ""}`}
        {...props}
      />
    </H5>
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof RadixDialog.Description>) {
  return (
    <Body2 asChild>
      <RadixDialog.Description
        data-slot="dialog-description"
        className={`${styles.description} ${className ?? ""}`}
        {...props}
      />
    </Body2>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
