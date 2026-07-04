import { useEffect } from "react"
import { useRouteStore } from "@/stores/route"
import type { Side } from "@/lib/url-state"
import { mergeQuery } from "@/lib/url-state"

/** The spotlight path. Anything else is treated as the overview. */
const SPOTLIGHT_PATH = "/spotlight"

const SIDES: Side[] = ["top-left", "top-right", "bottom-left", "bottom-right"]

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
      setSide(raw !== null && SIDES.includes(raw as Side) ? (raw as Side) : "top-right")
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

  useEffect(() => {
    mergeQuery({ side })
  }, [side])
}
