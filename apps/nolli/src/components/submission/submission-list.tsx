import { Fragment, type ReactNode } from "react"
import { Link, useNavigate } from "react-router"
import { Plus } from "lucide-react"
import { Body1, Body2, Skeleton } from "@nolli/ui"
import type { SubmissionPayload } from "@nolli/data"
import { MediaCard } from "@/components/card/media-card"
import styles from "./submission-list.module.css"
import { SidebarCard } from "../card/sidebar-card"

const STAGING_BASE = import.meta.env.VITE_R2_PUBLIC_STAGING_URL ?? ""

/** A raw payload-bearing list row. Both the mine and queue responses satisfy
 *  this; `submitter_name` is only present on queue rows. */
export type SubmissionListEntry = {
  id: number
  payload: SubmissionPayload
  created_at: string
  submitter_name?: string | null
}

export function SubmissionRow({
  entry,
  to,
  selected,
  foot,
}: {
  entry: SubmissionListEntry
  to: string
  selected: boolean
  foot?: ReactNode
}) {
  const navigate = useNavigate()
  const { name, architect, city } = entry.payload.metadata
  const cover = entry.payload.photos.find((p) => p.is_cover) ?? entry.payload.photos[0]
  const coverUrl = cover ? `${STAGING_BASE}/${cover.staging_key}` : null
  return (
    <MediaCard
      coverUrl={coverUrl}
      coverAlt={name}
      title={name}
      subtitle={`${architect} · ${city}`}
      foot={foot}
      data-selected={selected}
      onClick={() => navigate(to)}
    />
  )
}

/** Dashed "New submission" affordance shaped like a list row. Persistent —
 *  render it as a sibling above <SubmissionList> so it stays visible while the
 *  list loads or is empty. */
export function NewSubmissionCard() {
  return (
    <Link to="/submissions/new" >
      <SidebarCard className={styles.newCard}>
        <Body1 className={styles.newText}><Plus size={20}/> New submission</Body1>
      </SidebarCard>
    </Link>
  )
}

/** Placeholder matching SubmissionRow's shape: a 6rem thumbnail + text lines. */
function SubmissionRowSkeleton() {
  return (
    <Skeleton className={styles.skeletonRow}>
      <Skeleton className={styles.skeletonThumb} />
    </Skeleton>
  )
}

/** Renders the list body for a given load state: skeleton rows while pending,
 *  a plain message on error, `emptyText` when there are no rows, or the rows
 *  themselves produced by the `renderRow` prop. Row shape, href, selected
 *  state, and foot content are the caller's — this component owns no
 *  mode-specific behavior. */
export function SubmissionList({
  entries,
  loading,
  error,
  emptyText,
  renderRow,
}: {
  entries: SubmissionListEntry[]
  loading: boolean
  error?: string | null
  emptyText: string
  renderRow: (entry: SubmissionListEntry, index: number) => ReactNode
}) {
  if (loading) {
    return (
      <div className={styles.list}>
        {Array.from({ length: 3 }, (_, i) => (
          <SubmissionRowSkeleton key={i} />
        ))}
      </div>
    )
  }
  if (error) {
    return <Body2 className={styles.state}>{error}</Body2>
  }
  if (entries.length === 0) {
    return <Body2 className={styles.state}>{emptyText}</Body2>
  }
  return (
    <div className={styles.list}>
      {entries.map((e, i) => (
        <Fragment key={e.id}>{renderRow(e, i)}</Fragment>
      ))}
    </div>
  )
}
