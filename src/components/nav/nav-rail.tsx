import { useLocation, useNavigate } from "react-router"
import { Home, Star, Plus, Info } from "lucide-react"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import styles from "./nav-rail.module.css"
import { Button } from "../ui/button"

const navItems = [
  { icon: Home, label: "Map", path: "/", disabled: false},
  { icon: Star, label: "Favorites (Coming Soon)", path: "/favorites", disabled: true},
  { icon: Plus, label: "Submit (Coming Soon)", path: "/submit", disabled: true},
  { icon: Info, label: "About (Coming Soon)", path: "/about", disabled: true},
] as const

export function NavRail() {
  const location = useLocation()
  const navigate = useNavigate()

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/" || location.pathname.startsWith("/arch")
    return location.pathname.startsWith(path)
  }

  return (
    <TooltipProvider>
      <div className={styles.rail}>
        <div className={styles.navItems}>
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    data-active={active}
                    className={styles.navItem}
                    onClick={item.disabled ? undefined :() => navigate(item.path)}
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
