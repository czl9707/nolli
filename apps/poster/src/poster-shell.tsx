import { PosterMap } from "@/components/poster-map"
import { Header } from "@/components/header"
import { SelectionSidebar } from "@/components/selection-sidebar"
import { VisibleArchList } from "@/components/visible-arch-list"
import { SpotlightList } from "@/components/spotlight-list"
import { SpotlightOverlay } from "@/components/spotlight-overlay"
import { SideFlipControl } from "@/components/side-flip-control"
import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useVisibleArchs } from "@/hooks/use-visible-archs"
import { useRouteSync } from "@/hooks/use-route-sync"
import { useSpotlightFraming } from "@/hooks/use-spotlight-framing"
import { Skeleton, Tabs, TabsList, TabsTrigger } from "@nolli/ui"
import { useMemo } from "react"
import type { ReactNode } from "react"
import { useFilterStore } from "@nolli/data"
import { OperationPanel } from "@/components/operation-panel"
import { toPosterBuilding } from "@/lib/to-poster-building"
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
      {/* Sidebar stays mounted in both routes; preview mode hides it via
          `previewMode`. Every block is a SidebarSection so padding + labels
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
        <SidebarSection>
          <OperationPanel />
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
      <div className={styles.inset} data-poster-frame>
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
 *  multi-select overview list or the click-to-fly spotlight list. When a
 *  filter/search is active the source swaps to global filter results
 *  (cover-filtered to PosterBuilding) instead of viewport visibility. */
function VisibleSection({
  buildings,
  spotlight = false,
}: {
  buildings: PosterBuilding[]
  spotlight?: boolean
}) {
  const map = useMapInstanceStore((s) => s.map)
  const visible = useVisibleArchs(map, buildings)

  const architectIds = useFilterStore((s) => s.architectIds)
  const cityIds = useFilterStore((s) => s.cityIds)
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const filteredArchs = useFilterStore((s) => s.filteredArchs)
  const filterLoading = useFilterStore((s) => s.loading)
  const hasFilters =
    architectIds.length > 0 || cityIds.length > 0 || searchQuery.trim() !== ""

  const list = useMemo(() => {
    if (!hasFilters || filterLoading) return visible
    return filteredArchs
      .map(toPosterBuilding)
      .filter((b): b is PosterBuilding => b !== null)
  }, [hasFilters, filterLoading, filteredArchs, visible])

  const label = !hasFilters
    ? `In view · ${visible.length}`
    : filterLoading
      ? "Searching…"
      : `Results · ${list.length}`

  return (
    <SidebarSection grow label={label}>
      {spotlight ? (
        <SpotlightList buildings={list} />
      ) : (
        <VisibleArchList buildings={list} />
      )}
    </SidebarSection>
  )
}

/**
 * Loading skeleton that mirrors <PosterShell>'s layout: the same flex row,
 * sidebar width, and inset, with the sidebar reusing <SidebarSection> so
 * padding/label/grow match exactly. This keeps the hydrate from skeleton to
 * shell layout-shift-free. Sidebar sections approximate the real ones — tabs,
 * the operation panel (search + two filters), and the building list.
 */
export function PosterShellSkeleton() {
  return (
    <div className={styles.shell}>
      <div className={styles.sidebarSkeleton}>
        <SidebarSection>
          <Skeleton height="2rem" width="100%" />
        </SidebarSection>
        <SidebarSection>
          <Skeleton height="2.25rem" width="100%" />
          <Skeleton height="2.25rem" width="100%" />
          <Skeleton height="2.25rem" width="100%" />
        </SidebarSection>
        <SidebarSection grow>
          <Skeleton height="2.5rem" width="100%" />
          <Skeleton height="2.5rem" width="100%" />
          <Skeleton height="2.5rem" width="100%" />
        </SidebarSection>
      </div>
      <div className={styles.inset}>
        <Skeleton className={styles.skeletonHeader} width="100%" />
        <Skeleton className={styles.skeletonMap} width="100%" />
      </div>
    </div>
  )
}
