// apps/poster/src/hooks/use-route-sync.ts
import { useEffect } from "react"
import { useRouteStore } from "@/stores/route"

/** The spotlight path. Anything else is treated as the overview. */
const SPOTLIGHT_PATH = "/spotlight"

export function useRouteSync() {
  const route = useRouteStore((s) => s.route)
  const setRoute = useRouteStore((s) => s.setRoute)

  // Re-hydrate route from the URL on browser navigation (back/forward).
  useEffect(() => {
    const onPop = () => {
      setRoute(window.location.pathname === SPOTLIGHT_PATH ? "spotlight" : "overview")
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [setRoute])

  // Route → push a new pathname, preserving the current query string.
  useEffect(() => {
    const pathname = route === "spotlight" ? SPOTLIGHT_PATH : "/"
    if (window.location.pathname === pathname) return
    window.history.pushState(null, "", `${pathname}${window.location.search}`)
  }, [route])
}
