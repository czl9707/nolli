import { PosterShell, PosterShellSkeleton } from "@/poster-shell"
import { useDbStore, useFilterStore } from "@nolli/data"

export function App() {
  // App readiness now flows from the shared filter store (one-shot
  // `initialized` after the first getAllArchitectures load) + the db bootstrap
  // error — no app-local buildings cache.
  const loading = useFilterStore((s) => s.loading)
  const dbError = useDbStore((s) => s.error)

  if (dbError)
    return (
      <div style={{ padding: "var(--spacing-component)" }}>
        Error: {dbError.message}
      </div>
    )
  if (loading) return <PosterShellSkeleton />

  return <PosterShell />
}
