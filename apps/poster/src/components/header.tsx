import { useUiStore } from "@/stores/ui"
import { Button } from "@nolli/ui"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { CaptureToggle } from "./capture-toggle"
import styles from "./header.module.css"

/**
 * Desktop-only top bar, copy-adapted from nolli's Header. Holds the sidebar
 * toggle (wired to the poster's useUiStore), the brand, and on the right the
 * capture toggle + theme toggle.
 */
export function Header() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)

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
      <div className={styles.title}>Nolli</div>
      <div className={styles.right}>
        <CaptureToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
