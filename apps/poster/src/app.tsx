import { useSnapshot } from "@/data/use-snapshot"
import { PosterMap } from "@/components/poster-map"

export function App() {
  const snap = useSnapshot()

  if (snap.status === "loading") return <div style={{ padding: "2rem" }}>Loading…</div>
  if (snap.status === "error") return <div style={{ padding: "2rem" }}>Error: {snap.error.message}</div>

  return <PosterMap buildings={snap.buildings} />
}
