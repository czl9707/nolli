import { useEffect, useRef } from "react"
import { useRouteStore } from "@/stores/route"
import { parseMapParams, serializeMapParams } from "@/lib/url-state"
import { useSelectionStore } from "@/stores/selection"

/** The spotlight path. Anything else is treated as the overview. */
const SPOTLIGHT_PATH = "/spotlight"

function routeFromPath(pathname: string) {
  return pathname === SPOTLIGHT_PATH ? "spotlight" : "overview"
}

/**
 * Keeps the route (pathname) and `side` (query) in sync with the URL and the
 * route store. Mounted once from <PosterShell>.
 *
 * - On mount: hydrate store from pathname + ?side.
 * - On store change: write pathname (pushState on route change so the back
 *   button works; replaceState on side change — composition, not navigation).
 * - On popstate: re-hydrate from the URL.
 */
export function useRouteSync() {
  const route = useRouteStore((s) => s.route)
  const side = useRouteStore((s) => s.side)
  const setRoute = useRouteStore((s) => s.setRoute)
  const setSide = useRouteStore((s) => s.setSide)

  // Hydrate once on mount + on browser navigation.
  useEffect(() => {
    const hydrate = () => {
      setRoute(routeFromPath(window.location.pathname))
      const parsed = parseMapParams(window.location.search)
      setSide(parsed.side ?? "right")
    }
    hydrate()
    window.addEventListener("popstate", hydrate)
    return () => window.removeEventListener("popstate", hydrate)
  }, [setRoute, setSide])

  // Persist route + side to the URL whenever they change. Route changes are
  // navigation (pushState — back button returns to the other layout); side
  // changes are composition (replaceState — no back-button flooding).
  const prevRouteRef = useRef(route)
  useEffect(() => {
    const pathname = route === "spotlight" ? SPOTLIGHT_PATH : "/"
    const selection = useSelectionStore.getState().selected
    const query = serializeMapParams({ selection, side })
    const search = query ? `?${query}` : ""
    const next = `${pathname}${search}`
    // Skip when the URL text is already identical.
    if (`${window.location.pathname}${window.location.search}` === next) return
    const isNavigation = prevRouteRef.current !== route
    prevRouteRef.current = route
    const method = isNavigation ? "pushState" : "replaceState"
    window.history[method](null, "", next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, side])
}
