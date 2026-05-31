import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useSidebarStore } from "@/stores/sidebar"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import styles from "./header.module.css"
import { useNavigate } from "react-router"

export function Header() {
  const navigation = useNavigate()
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const toggle = useSidebarStore((s) => s.toggle)

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggle()}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </Button>
      </div>
      <div className={styles.title} onClick={() => navigation("/")}>
        <img src="/favicon.svg" alt="Nolli Icon" className={styles.icon} />
        Nolli
      </div>
      <div className={styles.right}>
        <ThemeToggle />
      </div>
    </header>
  )
}
