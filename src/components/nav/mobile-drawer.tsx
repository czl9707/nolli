import { useLocation, useNavigate } from "react-router"
import { Home, Star, Plus, Info } from "lucide-react"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog"
import { useSidebarStore } from "@/stores/sidebar"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_SHORT } from "@/lib/constants"
import styles from "./mobile-drawer.module.css"

const navItems = [
  { icon: Home, label: "Map", path: "/" },
  { icon: Star, label: "Favorites", path: "/favorites" },
  { icon: Plus, label: "Submit", path: "/submit" },
  { icon: Info, label: "About", path: "/about" },
] as const

export function MobileDrawer() {
  const location = useLocation()
  const navigate = useNavigate()
  const open = useSidebarStore((s) => s.mobileDrawerOpen)
  const setOpen = useSidebarStore((s) => s.setMobileDrawerOpen)

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/" || location.pathname.startsWith("/arch")
    return location.pathname.startsWith(path)
  }

  function handleNav(path: string) {
    navigate(path)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <DialogPortal forceMount>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
            >
              <DialogOverlay className={styles.overlay} />
            </motion.div>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
            >
              <DialogContent
                className={styles.content}
                showCloseButton={false}
                aria-label="Navigation"
              >
                <nav className={styles.navList}>
                  {navItems.map((item) => {
                    const active = isActive(item.path)
                    return (
                      <button
                        key={item.label}
                        className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                        onClick={() => handleNav(item.path)}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
                <div className={styles.spacer} />
                <div className={styles.divider} />
                <NavUser variant="compact" />
              </DialogContent>
            </motion.div>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
