import { Link } from "react-router"
import type { QueueEntry } from "@/lib/api/submissions"
import styles from "./queue-card.module.css"

export function QueueCard({ entry }: { entry: QueueEntry }) {
  return (
    <Link to={`/moderate/${entry.id}`} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.title}>{entry.name}</div>
        <div className={styles.meta}>
          {entry.architect} · {entry.city}
        </div>
        <div className={styles.foot}>
          {entry.submitter_name ?? "anonymous"} · {new Date(entry.created_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  )
}
