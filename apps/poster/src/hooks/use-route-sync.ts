import { useEffect } from "react"
import { useRouteStore } from "@/stores/route"
import type { Side } from "@/lib/url-state"
import { mergeQuery } from "@/lib/url-state"

/** The spotlight path. Anything else is treated as the overview. */
const SPOTLIGHT_PATH = "/spotlight"

const SIDES: Side[] = ["left", "right", "top", "bottom"]

/**
 * Keeps the route (pathname) and `side` (query) in sync with the URL and the
 * route store. Mounted once from <PosterShell>.
 *
 * Initial values come from the store's lazy initializer (which reads the URL at
 * creation), so there's no mount-time hydrate that could race with the map
 * hook's URL writes. Browser back/forward re-hydrates via popstate.
 *
 * - Route changes are navigation: pushState a new pathname, preserving query.
 * - Side changes are composition: replaceState, merging into existing query
 *   (so center/zoom/selection owned by use-map-url-state are preserved).
 */
export function useRouteSync() {
  const route = useRouteStore((s) => s.route)
  const side = useRouteStore((s) => s.side)
  const setRoute = useRouteStore((s) => s.setRoute)
  const setSide = useRouteStore((s) => s.setSide)

  // Re-hydrate from the URL on browser navigation (back/forward).
  useEffect(() => {
    const onPop = () => {
      setRoute(window.location.pathname === SPOTLIGHT_PATH ? "spotlight" : "overview")
      const raw = new URLSearchParams(window.location.search).get("side")
      setSide(raw !== null && SIDES.includes(raw as Side) ? (raw as Side) : "right")
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [setRoute, setSide])

  // Route → push a new pathname, preserving the current query string.
  useEffect(() => {
    const pathname = route === "spotlight" ? SPOTLIGHT_PATH : "/"
    if (window.location.pathname === pathname) return
    window.history.pushState(null, "", `${pathname}${window.location.search}`)
  }, [route])

  // Side → merge into the existing query (default "right" omits the key).
  useEffect(() => {
    mergeQuery({ side: side !== "right" ? side : undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side])
}
