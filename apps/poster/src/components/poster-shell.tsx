import { PosterMap } from "./poster-map"
import { Header } from "./header"
import { SelectionSidebar } from "./selection-sidebar"
import { VisibleArchList } from "./visible-arch-list"
import { SpotlightList } from "./spotlight-list"
import { SpotlightOverlay } from "./spotlight-overlay"
import { SideFlipControl } from "./side-flip-control"
import { SidebarTabs } from "./sidebar-tabs"
import { useRouteStore } from "@/stores/route"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useVisibleArchs } from "@/hooks/use-visible-archs"
import { useRouteSync } from "@/hooks/use-route-sync"
import { useSpotlightFraming } from "@/hooks/use-spotlight-framing"
import { Body2, Skeleton } from "@nolli/ui"
import type { PosterBuilding } from "@/types"
import styles from "../app.module.css"

/**
 * Always-mounted shell. <ArchMap> (via <PosterMap>) never unmounts across the
 * overview ↔ spotlight switch — only the sidebar's list region and the map
 * overlay change. This keeps tiles, view state, and cluster animations alive.
 */
export function PosterShell({
  buildings,
  buildingsReady,
}: {
  buildings: PosterBuilding[]
  buildingsReady: boolean
}) {
  const route = useRouteStore((s) => s.route)
  const isSpotlight = route === "spotlight"
  useRouteSync()
  useSpotlightFraming(buildings, buildingsReady)

  return (
    <div className={styles.shell}>
      {/* Sidebar stays mounted in both routes; capture mode hides it via
          `sidebarOpen`. The tab group switches layout; below it, overview shows
          the multi-select list, spotlight shows the side-flip + click-to-fly
          list. */}
      <SelectionSidebar>
        <SidebarTabs />
        {isSpotlight ? (
          <>
            <SideFlipControl />
            <VisibleSection buildings={buildings} spotlight />
          </>
        ) : (
          <VisibleSection buildings={buildings} />
        )}
      </SelectionSidebar>
      {/* `.inset` is relative + flex:1; the map is absolute-fill inside it
          (full-bleed), the header floats on top, and the spotlight hero anchors
          to `.inset`. The map stays mounted across the route switch. */}
      <div className={styles.inset}>
        <Header />
        <PosterMap buildings={buildings} spotlight={isSpotlight} />
        {isSpotlight && <SpotlightOverlay buildings={buildings} />}
      </div>
    </div>
  )
}

/** Viewport-visible buildings, headed by a count, rendered as either the
 *  multi-select overview list or the click-to-fly spotlight list. */
function VisibleSection({
  buildings,
  spotlight = false,
}: {
  buildings: PosterBuilding[]
  spotlight?: boolean
}) {
  const map = useMapInstanceStore((s) => s.map)
  const visible = useVisibleArchs(map, buildings)
  return (
    <>
      <div className={styles.sidebarHeader}>
        <Body2>In view · {visible.length}</Body2>
      </div>
      {spotlight ? (
        <SpotlightList buildings={visible} />
      ) : (
        <VisibleArchList buildings={visible} />
      )}
    </>
  )
}

export function PosterShellSkeleton() {
  return (
    <div style={{ padding: "var(--spacing-component)", display: "grid", gap: "var(--spacing-paragraph)" }}>
      <Skeleton height="var(--size-header-height)" />
      <Skeleton height="2rem" />
      <Skeleton height="2rem" />
    </div>
  )
}
