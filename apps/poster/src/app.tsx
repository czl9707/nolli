import { useBuildings } from "@/data/use-buildings"
import { PosterShell, PosterShellSkeleton } from "@/components/poster-shell"
import { useMapUrlState } from "@/hooks/use-map-url-state"

export function App() {
  const snap = useBuildings()
  const buildingsReady = snap.status === "ready"
  useMapUrlState(buildingsReady)

  if (snap.status === "loading") return <PosterShellSkeleton />
  if (snap.status === "error")
    return <div style={{ padding: "var(--spacing-component)" }}>Error: {snap.error.message}</div>

  return <PosterShell buildings={snap.buildings} />
}
