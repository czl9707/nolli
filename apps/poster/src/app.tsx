import { useMap } from "@nolli/map"
import { useSnapshot } from "@/data/use-snapshot"
import { useVisibleArchs } from "@/hooks/use-visible-archs"
import { PosterMap } from "@/components/poster-map"
import { SelectionSidebar } from "@/components/selection-sidebar"
import { VisibleArchList } from "@/components/visible-arch-list"
import type { PosterBuilding } from "@/types"

export function App() {
  const snap = useSnapshot()

  if (snap.status === "loading") return <div style={{ padding: "2rem" }}>Loading…</div>
  if (snap.status === "error") return <div style={{ padding: "2rem" }}>Error: {snap.error.message}</div>

  return (
    <>
      <PosterMap buildings={snap.buildings} />
      <SelectionSidebar>
        <VisibleArchListBridge buildings={snap.buildings} />
      </SelectionSidebar>
    </>
  )
}

/** Reads the map from context to compute viewport-visible buildings. */
function VisibleArchListBridge({ buildings }: { buildings: PosterBuilding[] }) {
  const { map } = useMap()
  const visible = useVisibleArchs(map, buildings)
  return (
    <>
      <div
        style={{
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#888",
          marginBottom: "0.75rem",
        }}
      >
        In view · {visible.length}
      </div>
      <VisibleArchList buildings={visible} />
    </>
  )
}
