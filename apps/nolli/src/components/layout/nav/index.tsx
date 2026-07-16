import { Link } from "react-router"
import { Home, Star, Plus, Info, Shield } from "lucide-react"
import { NavUser } from "./nav-user"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@nolli/ui"
import { Dialog as RadixDialog } from "radix-ui"
import { useSidebarStore } from "@/stores/sidebar"
import { useAuthStore } from "@/stores/auth"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { useLayout } from "@/hooks/use-layout"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_INSTANT } from "@nolli/ui"
import { Button } from "@nolli/ui"
import styles from "./nav-sidebar.module.css"
import { H5 } from "@nolli/ui"

type NavItem = {
  icon: typeof Home
  label: string
  path: string
  disabled: boolean
}

/** Desktop: icon rail */
function Rail() {
  const { isActive } = useLayout()
  const user = useAuthStore((s) => s.user)
  const items: NavItem[] = [
    { icon: Home, label: "Map", path: "/", disabled: false },
    { icon: Star, label: "Favorites", path: "/favorite", disabled: false },
    {
      icon: Plus,
      label: user ? "Submit" : "Submit (not logged in)",
      path: "/submit",
      disabled: !user,
    },
    ...((user?.role === "moderator" || user?.role === "admin")
      ? [{ icon: Shield, label: "Moderate", path: "/moderate", disabled: false }]
      : []),
    { icon: Info, label: "About", path: "/about", disabled: false },
  ]

  return (
    <TooltipProvider>
      <div className={styles.rail}>
        <div className={styles.faviconContainer}>
          <Link to="/" >
            <img src="/favicon.svg" alt="Nolli" className={styles.favicon} />
          </Link>
        </div>
        <div className={styles.navItems}>
          {items.map((item) => {
            const active = isActive(item.path)
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  {item.disabled ? (
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      data-active={active}
                      data-disabled={true}
                      className={styles.navItem}
                      aria-label={item.label}
                    >
                      <item.icon size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      data-active={active}
                      className={styles.navItem}
                      aria-label={item.label}
                      asChild
                    >
                      <Link to={item.path}>
                        <item.icon size={16} />
                      </Link>
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        <div className={styles.spacer} />
        <NavUser variant="compact" />
      </div>
    </TooltipProvider>
  )
}

/** Mobile: slide-in drawer via Radix Dialog portal */
function Drawer() {
  const { isActive } = useLayout()
  const user = useAuthStore((s) => s.user)
  const items: NavItem[] = [
    { icon: Home, label: "Map", path: "/", disabled: false },
    { icon: Star, label: "Favorites", path: "/favorite", disabled: false },
    {
      icon: Plus,
      label: user ? "Submit" : "Submit (not logged in)",
      path: "/submit",
      disabled: !user,
    },
    ...((user?.role === "moderator" || user?.role === "admin")
      ? [{ icon: Shield, label: "Moderate", path: "/moderate", disabled: false }]
      : []),
    { icon: Info, label: "About", path: "/about", disabled: false },
  ]
  const open = useSidebarStore((s) => s.mobileDrawerOpen)
  const setOpen = useSidebarStore((s) => s.setMobileDrawerOpen)

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <RadixDialog.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: TRANSITION_INSTANT, ease: "easeInOut" }}
              >
                <RadixDialog.Overlay forceMount />
              </motion.div>
              <motion.div
                className={styles.contentWrapper}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: TRANSITION_INSTANT, ease: "easeInOut" }}
              >
                <RadixDialog.Content
                className={styles.content}
                  aria-label="Navigation"
                  forceMount
                >
                  <Link to="/" className={styles.header} onClick={() => setOpen(false)}>
                    <img src="/favicon.svg" alt="Nolli" className={styles.icon} />
                    <H5 className={styles.title}><b>Nolli</b></H5>
                  </Link>
                  <div className={styles.divider} />
                  <nav className={styles.navList}>
                    {items.map((item) => {
                      const active = isActive(item.path)
                      if (item.disabled) {
                        return (
                          <Button
                            key={item.label}
                            className={styles.drawerNavItem}
                            variant="ghost"
                            data-active={active}
                            data-disabled={true}
                          >
                            <item.icon size={18} />
                            {item.label}
                          </Button>
                        )
                      }
                      return (
                        <Button
                          key={item.label}
                          className={styles.drawerNavItem}
                          variant="ghost"
                          data-active={active}
                          asChild
                        >
                          <Link to={item.path} onClick={() => setOpen(false)}>
                            <item.icon size={18} />
                            {item.label}
                          </Link>
                        </Button>
                      )
                    })}
                  </nav>
                  <div className={styles.spacer} />
                  <div className={styles.divider} />
                  <NavUser />
                </RadixDialog.Content>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

/** Self-contained: rail on desktop, drawer on mobile */
export function NavSidebar() {
  const isMobile = useIsMobile()

  if (isMobile) return <Drawer />
  return <Rail />
}
