import { PosterMap } from "./poster-map"
import { Header } from "./header"
import { SelectionSidebar } from "./selection-sidebar"
import { VisibleArchList } from "./visible-arch-list"
import { SpotlightList } from "./spotlight-list"
import { SpotlightOverlay } from "./spotlight-overlay"
import { SideFlipControl } from "./side-flip-control"
import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useVisibleArchs } from "@/hooks/use-visible-archs"
import { useRouteSync } from "@/hooks/use-route-sync"
import { useSpotlightFraming } from "@/hooks/use-spotlight-framing"
import { Skeleton, Tabs, TabsList, TabsTrigger } from "@nolli/ui"
import type { ReactNode } from "react"
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
  const setRoute = useRouteStore((s) => s.setRoute)
  const isSpotlight = route === "spotlight"
  useRouteSync()
  useSpotlightFraming(buildings, buildingsReady)

  return (
    <div className={styles.shell}>
      {/* Sidebar stays mounted in both routes; capture mode hides it via
          `sidebarOpen`. Every block is a SidebarSection so padding + labels
          stay uniform; the list section grows to fill the remaining height. */}
      <SelectionSidebar>
        <SidebarSection>
          <Tabs value={route} onValueChange={(v) => setRoute(v as Route)}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="spotlight">Spotlight</TabsTrigger>
            </TabsList>
          </Tabs>
        </SidebarSection>
        {isSpotlight ? (
          <>
            <SidebarSection label="Photo">
              <SideFlipControl />
            </SidebarSection>
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

/** A uniform sidebar block: consistent padding, optional label, flex column.
 *  `grow` fills the sidebar's remaining height (the building list uses it). */
function SidebarSection({
  label,
  grow = false,
  children,
}: {
  label?: string
  grow?: boolean
  children: ReactNode
}) {
  return (
    <section
      className={`${styles.sidebarSection} ${grow ? styles.sidebarSectionGrow : ""}`}
    >
      {label && <span className={styles.sectionLabel}>{label}</span>}
      {children}
    </section>
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
    <SidebarSection grow label={`In view · ${visible.length}`}>
      {spotlight ? (
        <SpotlightList buildings={visible} />
      ) : (
        <VisibleArchList buildings={visible} />
      )}
    </SidebarSection>
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
