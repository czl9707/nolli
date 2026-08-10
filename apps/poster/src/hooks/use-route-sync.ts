// apps/poster/src/hooks/use-route-sync.ts
import { useEffect } from "react"
import {
  isRoutePath,
  pathFromRoute,
  routeFromPath,
  useRouteStore,
} from "@/stores/route"

export function useRouteSync() {
  const route = useRouteStore((s) => s.route)
  const setRoute = useRouteStore((s) => s.setRoute)

  // Re-hydrate route from the URL on browser navigation (back/forward).
  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [setRoute])

  // Route → URL: pushState between routes, replaceState to normalize an
  // unknown pathname (e.g. "/") onto its real path. Query string preserved.
  useEffect(() => {
    const target = pathFromRoute(route)
    if (window.location.pathname === target) return
    const next = `${target}${window.location.search}`
    if (isRoutePath(window.location.pathname)) {
      window.history.pushState(null, "", next)
    } else {
      window.history.replaceState(null, "", next)
    }
  }, [route])
}
