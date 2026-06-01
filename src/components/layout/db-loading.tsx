import { useDbContext } from "@/lib/data/db-context"
import styles from "./db-loading.module.css"

export function DbLoading({ children }: { children: React.ReactNode }) {
  const { status, error, retry } = useDbContext()

  if (status === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error?.message ?? "Failed to load database"}</p>
        <button onClick={retry}>Retry</button>
      </div>
    )
  }

  return <>{children}</>
}
