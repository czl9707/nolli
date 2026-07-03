import { Tabs, TabsList, TabsTrigger } from "@nolli/ui"
import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import styles from "./sidebar-tabs.module.css"

/**
 * Two-tab switcher (Overview / Spotlight) at the top of the sidebar, built on
 * the shared <Tabs> from @nolli/ui. The layout choice lives next to the
 * building list it governs.
 */
export function SidebarTabs() {
  const route = useRouteStore((s) => s.route)
  const setRoute = useRouteStore((s) => s.setRoute)

  return (
    <Tabs
      value={route}
      onValueChange={(v) => setRoute(v as Route)}
      className={styles.tabs}
    >
      <TabsList className={styles.list}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="spotlight">Spotlight</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
