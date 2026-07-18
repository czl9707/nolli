import type { FormEvent, ReactNode } from "react"
import { Link } from "react-router"
import { ArrowLeft, CloudOff, Loader2 } from "lucide-react"
import { Button, Body2, H2, Caption } from "@nolli/ui"
import styles from "./submission-shell.module.css"

export function SubmissionShell({
  title,
  lead,
  ready = true,
  error,
  onSubmit,
  actions,
  children,
}: {
  title: string
  lead?: string
  ready?: boolean
  error?: ReactNode
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.topbar}>
        <div className={styles.heading}>
          <H2>{title}</H2>
          {lead && <Caption className={styles.lead}>{lead}</Caption>}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft size={16} /> Map
          </Link>
        </Button>
      </div>
      <div className={styles.body}>
        <div className={styles.content} inert={!ready || !!error}>
          {onSubmit ? (
            <form className={styles.form} onSubmit={onSubmit}>
              {children}
              {actions && <div className={styles.actions}>{actions}</div>}
            </form>
          ) : (
            children
          )}
        </div>
        {!ready && (
          <div className={styles.overlay} aria-hidden>
            <Loader2 size={20} className={styles.spin} />
          </div>
        )}
        {error && (
          <div className={styles.overlay}>
            <div className={styles.errorBody} role="alert">
              <CloudOff size={20} className={styles.errorIcon} />
              <Body2>{error}</Body2>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
