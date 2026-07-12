import { useEffect, useState } from "react"
import { Seo } from "@/components/layout/seo"
import { Section, StaticPageShell } from "@/components/layout/static-page-shell"
import { Body2, Button, H3 } from "@nolli/ui"
import { useAuthStore } from "@/stores/auth"
import { listQueue, type QueueEntry } from "@/lib/api/submissions"
import { QueueCard } from "./queue-card"

export function ModeratePage() {
  const { user, initialized } = useAuthStore()
  const isMod = user?.role === "moderator" || user?.role === "admin"
  const [entries, setEntries] = useState<QueueEntry[] | null>(null)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!initialized || !isMod) return
    let cancelled = false
    listQueue()
      .then((r) => { if (!cancelled) setEntries(r.submissions) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [initialized, isMod, retryKey])

  if (!initialized) return <StaticPageShell title="Moderate">Loading…</StaticPageShell>
  if (!isMod) return <StaticPageShell title="Moderate"><Body2>Not available.</Body2></StaticPageShell>

  let content
  if (error) {
    content = (<>
      <Body2>Could not load the queue.</Body2>
      <Button variant="outline" onClick={() => { setError(false); setEntries(null); setRetryKey((k) => k + 1) }}>Retry</Button>
    </>)
  } else if (entries === null) {
    content = <Body2>Loading…</Body2>
  } else if (entries.length === 0) {
    content = <Body2>Nothing to review.</Body2>
  } else {
    content = entries.map((e) => <QueueCard key={e.id} entry={e} />)
  }

  return (
    <>
      <Seo title="Moderate" description="Review building submissions." path="/moderate" />
      <StaticPageShell title="Moderation queue">
        <Section>
          <H3>Pending</H3>
          {content}
        </Section>
      </StaticPageShell>
    </>
  )
}
