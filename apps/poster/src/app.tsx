import { useBuildings } from "@/data/use-buildings"
import { useVisibleArchs } from "@/hooks/use-visible-archs"
import { useMapInstanceStore } from "@/stores/map-instance"
import { PosterMap } from "@/components/poster-map"
import { Header } from "@/components/header"
import { SelectionSidebar } from "@/components/selection-sidebar"
import { VisibleArchList } from "@/components/visible-arch-list"
import type { PosterBuilding } from "@/types"
import styles from "./app.module.css"

export function App() {
  const snap = useBuildings()

  if (snap.status === "loading") return <div style={{ padding: "2rem" }}>Loading…</div>
  if (snap.status === "error") return <div style={{ padding: "2rem" }}>Error: {snap.error.message}</div>

  return (
    <div className={styles.shell}>
      <SelectionSidebar>
        <VisibleArchListBridge buildings={snap.buildings} />
      </SelectionSidebar>
      <div className={styles.inset}>
        <Header />
        <PosterMap buildings={snap.buildings} />
      </div>
    </div>
  )
}

/** Reads the map from the shared store to compute viewport-visible buildings. */
function VisibleArchListBridge({ buildings }: { buildings: PosterBuilding[] }) {
  const map = useMapInstanceStore((s) => s.map)
  const visible = useVisibleArchs(map, buildings)
  return (
    <>
      <div className={styles.sidebarHeader}>
        In view · {visible.length}
      </div>
      <VisibleArchList buildings={visible} />
    </>
  )
}
