import { PosterMap } from "@/components/shared/poster-map"
import { Header } from "@/components/shared/header"
import { SelectionSidebar } from "@/components/shared/selection-sidebar"
import { VisibleArchList } from "@/components/overview/visible-arch-list"
import { SpotlightList } from "@/components/spotlight/spotlight-list"
import { SpotlightImageStrip } from "@/components/spotlight/spotlight-image-strip"
import { Caption } from "@/components/shared/caption"
import { CaptionOptions } from "@/components/shared/caption-options"
import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useVisibleArchs } from "@nolli/map"
import { useRouteSync } from "@/hooks/use-route-sync"
import { useSpotlightFraming } from "@/hooks/spotlight/use-spotlight-framing"
import { useCaptionUrlSync } from "@/hooks/use-caption-url-sync"
import {
  Body3,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@nolli/ui"
import { useState } from "react"
import type { ReactNode } from "react"
import { useFilterStore } from "@nolli/data"
import type { ArchSummary } from "@nolli/data"
import { OperationPanel } from "@/components/shared/operation-panel"
import styles from "./app.module.css"

/**
 * Always-mounted shell. <ArchMap> (via <PosterMap>) never unmounts across the
 * overview ↔ spotlight switch — only the sidebar's list region and the map
 * overlay change. This keeps tiles, view state, and cluster animations alive.
 *
 * Data flow mirrors nolli: the display set is `filteredArchs` from the shared
 * filter store, then narrowed to the viewport via `useVisibleArchs`. That
 * single `visible` set feeds both the map markers and the sidebar list — no
 * prop-drilled `buildings` array, no app-local full-set cache. Slug-lookup
 * components (caption, strip, framing) resolve the selected building on demand
 * by slug via the selection store, exactly like nolli's `useArchDetailStore`.
 */
export function PosterShell() {
  const route = useRouteStore((s) => s.route)
  const setRoute = useRouteStore((s) => s.setRoute)
  const isSpotlight = route === "spotlight"
  const map = useMapInstanceStore((s) => s.map)
  const filteredArchs = useFilterStore((s) => s.filteredArchs)
  const visible = useVisibleArchs(map, filteredArchs)
  useRouteSync()
  useSpotlightFraming()
  useCaptionUrlSync()

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
        <SidebarSection grow label={`In view · ${visible.length}`}>
          {isSpotlight ? (
            <SpotlightList buildings={visible} />
          ) : (
            <VisibleArchList buildings={visible} />
          )}
        </SidebarSection>
        <SidebarSection label="Caption options" collapsible defaultOpen={false}>
          <CaptionOptions />
        </SidebarSection>
      </SelectionSidebar>
      <div className={styles.inset} data-poster-frame>
        <Header />
        <PosterMap architectures={visible} spotlight={isSpotlight} />
        {isSpotlight && <SpotlightImageStrip />}
        {/* Caption is shared by both routes. Spotlight resolves text from the
            selected building (custom overrides win); overview is freeform —
            custom text only, omitted entirely when both fields are empty. */}
        <Caption spotlight={isSpotlight} />
      </div>
    </div>
  )
}

/** A uniform sidebar block: consistent padding, optional label, flex column.
 *  `grow` fills the sidebar's remaining height (the building list uses it).
 *  `collapsible` turns the label into a trigger (with a right-side triangle)
 *  that shows/hides the children — used by the spotlight Layout/Caption
 *  options, which are collapsed by default. */
function SidebarSection({
  label,
  grow = false,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  label?: string
  grow?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <section
        className={`${styles.sidebarSection} ${grow ? styles.sidebarSectionGrow : ""}`}
      >
        {label && <Body3 className={styles.sectionLabel}>{label}</Body3>}
        {children}
      </section>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <section
        className={`${styles.sidebarSection} ${grow ? styles.sidebarSectionGrow : ""}`}
      >
        {label && (
          <CollapsibleTrigger asChild>
            <button type="button" className={styles.sectionTrigger}>
              <Body3 className={styles.sectionLabel}>{label}</Body3>
              <span
                className={`${styles.sectionTriangle} ${open ? styles.sectionTriangleOpen : ""}`}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>{children}</CollapsibleContent>
      </section>
    </Collapsible>
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
