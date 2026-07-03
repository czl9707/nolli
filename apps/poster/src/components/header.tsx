import { useRouteStore } from "@/stores/route"
import { useUiStore } from "@/stores/ui"
import { Button, H6 } from "@nolli/ui"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { CaptureToggle } from "./capture-toggle"
import styles from "./header.module.css"

/**
 * Desktop-only top bar, copy-adapted from nolli's Header. Holds the sidebar
 * toggle (wired to the poster's useUiStore), the brand, and on the right the
 * route toggle, capture toggle + theme toggle.
 */
export function Header() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const route = useRouteStore((s) => s.route)
  const setRoute = useRouteStore((s) => s.setRoute)

  return (
    <header className={styles.header}>
      <div className={styles.sidebarButton}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </Button>
      </div>
      <H6 className={styles.title}>Nolli</H6>
      <div className={styles.right}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRoute(route === "spotlight" ? "overview" : "spotlight")}
          aria-label="Toggle spotlight"
        >
          {route === "spotlight" ? "Overview" : "Spotlight"}
        </Button>
        <CaptureToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
