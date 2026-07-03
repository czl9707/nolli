import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import styles from "./sidebar-tabs.module.css"

const TABS: { id: Route; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "spotlight", label: "Spotlight" },
]

/**
 * Two-tab switcher (Overview / Spotlight) at the top of the sidebar. Replaces
 * the old header route button so the layout choice lives next to the building
 * list it governs.
 */
export function SidebarTabs() {
  const route = useRouteStore((s) => s.route)
  const setRoute = useRouteStore((s) => s.setRoute)

  return (
    <div className={styles.wrap} role="tablist" aria-label="Poster layout">
      {TABS.map((t) => {
        const active = route === t.id
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            className={`${styles.tab} ${active ? styles.active : ""}`}
            onClick={() => setRoute(t.id)}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
