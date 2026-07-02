// src/components/layout/static-page-shell.tsx

import type { ReactNode } from "react"
import { Link } from "react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@nolli/ui"
import { ScrollArea } from "@nolli/ui"
import { Body1, Caption, H1, H2 } from "@nolli/ui"
import styles from "./static-page-shell.module.css"

interface StaticPageShellProps {
  title: string
  lead?: string
  lastUpdated?: string
  children: ReactNode
}

export function Section({ children }: { children: ReactNode}) {
  return (
    <section className={styles.section}>
      {children}
    </section>
  )
}

export function StaticPageShell({ title, lead, lastUpdated, children }: StaticPageShellProps) {
  return (
    <ScrollArea className={styles.root}>
      <div className={styles.container}>
        <H1 className={styles.centered}>{title}</H1>
        {lead && (
          <Body1 className={styles.centered}><i>{lead}</i></Body1>
        )}
        {lastUpdated && (
          <Caption className={styles.centered}>
            Last updated: {lastUpdated}
          </Caption>
        )}
        <div className={styles.body}>{children}</div>
        <Button asChild variant="link" className={styles.back}>
          <Link to="/">
            <ArrowLeft size={16} />
            Back to the map
          </Link>
        </Button>
      </div>
    </ScrollArea>
  )
}
