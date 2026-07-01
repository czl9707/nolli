import { useSnapshot } from "@/data/use-snapshot"

export function App() {
  const snap = useSnapshot()

  if (snap.status === "loading") return <div style={{ padding: "2rem" }}>Loading…</div>
  if (snap.status === "error") return <div style={{ padding: "2rem" }}>Error: {snap.error.message}</div>

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      Poster — {snap.buildings.length} buildings loaded
    </div>
  )
}
