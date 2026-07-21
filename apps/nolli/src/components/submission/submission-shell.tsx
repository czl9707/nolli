import type { FormEvent, ReactNode } from "react"
import { CloudOff, Loader2 } from "lucide-react"
import { Body2, H2, Caption } from "@nolli/ui"
import styles from "./submission-shell.module.css"

export function SubmissionShell({
  title,
  lead,
  ready = true,
  error,
  onSubmit,
  actions,
  aside,
  children,
}: {
  title: string
  lead?: string
  ready?: boolean
  error?: ReactNode
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  actions?: ReactNode
  aside?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <div className={styles.main}>
          <div className={styles.topbar}>
            <div className={styles.heading}>
              <H2>{title}</H2>
              {lead && <Caption className={styles.lead}>{lead}</Caption>}
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.content} inert={!ready || !!error}>
              {onSubmit ? (
                <form className={styles.form} onSubmit={onSubmit}>
                  <div className={styles.columnsRow}>
                    <div className={styles.fields}>{children}</div>
                    {aside && <aside className={styles.aside}>{aside}</aside>}
                  </div>
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
      </div>
    </div>
  )
}
