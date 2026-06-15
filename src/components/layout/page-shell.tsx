// src/components/layout/page-shell.tsx

import type { ReactNode } from "react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Body1, Caption, H1 } from "@/components/ui/typography"
import styles from "./page-shell.module.css"

interface PageShellProps {
  title: string
  lead?: string
  lastUpdated?: string
  children: ReactNode
}

export function PageShell({ title, lead, lastUpdated, children }: PageShellProps) {
  return (
    <ScrollArea className={styles.root}>
      <div className={styles.container}>
        <H1 className={styles.title}>{title}</H1>
        {lead && (
          <Body1 asChild>
            <p className={styles.lead}>{lead}</p>
          </Body1>
        )}
        {lastUpdated && (
          <Caption asChild>
            <p className={styles.lastUpdated}>
              Last updated: {lastUpdated}
            </p>
          </Caption>
        )}
        <div className={styles.body}>{children}</div>
        <Button asChild variant="link" className={styles.back}>
          <Link to="/">Back to the map</Link>
        </Button>
      </div>
    </ScrollArea>
  )
}
