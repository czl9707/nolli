import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useSidebar } from "@/contexts/sidebar"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import styles from "./header.module.css"
import { useNavigate } from "react-router"

export function Header() {
  const navigation = useNavigate()
  const { sidebarOpen, setSidebarOpen } = useSidebar()

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
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
