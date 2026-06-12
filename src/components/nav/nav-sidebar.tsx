import { useLocation, useNavigate } from "react-router"
import { Home, Star, Plus, Info } from "lucide-react"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog as RadixDialog } from "radix-ui"
import { useSidebarStore } from "@/stores/sidebar"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_INSTANT } from "@/lib/constants"
import { Button } from "../ui/button"
import styles from "./nav-sidebar.module.css"
import { H5 } from "../ui/typography"

const navItems = [
  { icon: Home, label: "Map", path: "/", disabled: false },
  { icon: Star, label: "Favorites (Coming Soon)", path: "/favorites", disabled: true },
  { icon: Plus, label: "Submit (Coming Soon)", path: "/submit", disabled: true },
  { icon: Info, label: "About (Coming Soon)", path: "/about", disabled: true },
] as const

function isActiveRoute(path: string, pathname: string) {
  if (path === "/") return pathname === "/" || pathname.startsWith("/arch")
  return pathname.startsWith(path)
}

/** Desktop: icon rail */
function Rail() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <TooltipProvider>
      <div className={styles.rail}>
        <div className={styles.faviconContainer}>
          <img
            src="/favicon.svg"
            alt="Nolli"
            className={styles.favicon}
            onClick={() => navigate("/")}
            />
        </div>
        <div className={styles.navItems}>
          {navItems.map((item) => {
            const active = isActiveRoute(item.path, location.pathname)
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    data-active={active}
                    className={styles.navItem}
                    onClick={item.disabled ? undefined : () => navigate(item.path)}
                    aria-label={item.label}
                  >
                    <item.icon size={16} />
                  </Button>
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
  const location = useLocation()
  const navigate = useNavigate()
  const open = useSidebarStore((s) => s.mobileDrawerOpen)
  const setOpen = useSidebarStore((s) => s.setMobileDrawerOpen)

  function handleNav(path: string) {
    navigate(path)
    setOpen(false)
  }

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
                  <div className={styles.header} onClick={() => handleNav("/")}>
                    <img src="/favicon.svg" alt="Nolli" className={styles.icon} />
                    <H5 className={styles.title}><b>Nolli</b></H5>
                  </div>
                  <div className={styles.divider} />
                  <nav className={styles.navList}>
                    {navItems.map((item) => {
                      const active = isActiveRoute(item.path, location.pathname)
                      return (
                        <Button
                          key={item.label}
                          className={styles.drawerNavItem}
                          variant="ghost"
                          data-active={active}
                          onClick={() => handleNav(item.path)}
                        >
                          <item.icon size={18} />
                          {item.label}
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
