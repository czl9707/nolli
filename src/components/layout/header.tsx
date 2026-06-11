import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useSidebarStore } from "@/stores/sidebar"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useNavigate } from "react-router"
import { useIsMobile } from "@/hooks/use-is-mobile"
import styles from "./header.module.css"

export function Header() {
  const navigation = useNavigate()
  const isMobile = useIsMobile()
  const sidebarOpen = useSidebarStore((s) => s.sidebarOpen)
  const toggle = useSidebarStore((s) => s.toggle)
  const setMobileDrawerOpen = useSidebarStore((s) => s.setMobileDrawerOpen)

  function handleToggle() {
    if (isMobile) {
      setMobileDrawerOpen(true)
    } else {
      toggle()
    }
  }

  const isOpen = isMobile ? false : sidebarOpen

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          aria-label={isMobile ? "Open navigation" : isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? (
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
