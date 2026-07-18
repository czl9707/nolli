import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useSidebarStore } from "@/stores/sidebar"
import { Button } from "@nolli/ui"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Link } from "react-router"
import { useIsMobile } from "@/hooks/use-is-mobile"
import styles from "./header.module.css"

export function Header() {
  const isMobile = useIsMobile()
  const mounted = useSidebarStore((s) => s.mounted)
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
  // Desktop sidebar toggle only while a <SideBar> is mounted; mobile always
  // shows it (opens the nav drawer, which is real navigation).
  const showSideBar = isMobile || mounted

  return (
    <header className={styles.header}>
      {
        showSideBar &&
        <div className={styles.sidebarButton}>
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
      }
      {
        isMobile &&
        <Link to="/" className={styles.title}>
          <img src="/favicon.svg" alt="Nolli Icon" className={styles.icon} />
          Nolli
        </Link>
      }
      <div className={styles.right}>
        <ThemeToggle />
      </div>
    </header>
  )
}
