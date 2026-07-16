import { useMemo } from "react"
import { useLocation } from "react-router"

export type Layout = "map" | "board" | "static"

/**
 * Single source of truth for "which layout are we in", derived from the URL.
 * Map is opt-in: only the map-bearing prefixes are `"map"`; anything else
 * (including new pages) falls through to `"static"` so map-only chrome like the
 * sidebar toggle never appears by accident.
 *
 * - `"map"`    — `/`, `/favorite`, `/arch/:slug`
 * - `"board"`  — `/arch/:slug/board`  (pin-board view; takes precedence over map)
 * - `"static"` — everything else (default)
 */
export function useLayout() {
  const { pathname } = useLocation()

  return useMemo(() => {
    const isBoard = /^\/arch\/[^/]+\/board$/.test(pathname)
    const isMap =
      pathname === "/" ||
      pathname.startsWith("/arch") ||
      pathname.startsWith("/favorite")
    const layout: Layout = isBoard ? "board" : isMap ? "map" : "static"

    const match = pathname.match(/^\/arch\/([^/]+)/)

    const isActive = (path: string) =>
      path === "/"
        ? pathname === "/" || pathname.startsWith("/arch")
        : pathname.startsWith(path)

    return {
      pathname,
      layout,
      isMap: layout === "map",
      isBoard: layout === "board",
      isStatic: layout === "static",
      archSlug: match?.[1] ?? null,
      isActive,
    }
  }, [pathname])
}
