import { useLandingData } from "@/lib/landing-data"

export function App() {
  const { status, error } = useLandingData()
  return (
    <main>
      {status === "loading" && <p className="boot-msg">loading the map…</p>}
      {status === "error" && (
        <p className="boot-msg boot-msg--err">{error?.message ?? "failed to load map data"}</p>
      )}
      {/* stage mounts in Task 6 */}
    </main>
  )
}
