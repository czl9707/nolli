import { useMemo } from "react"
import { useLocation } from "react-router"

export type Layout = "map" | "board" | "static"

/**
 * Single source of truth for "which layout are we in", derived from the URL.
 *
 * - `"map"`    — `/` or `/arch/:slug`        (home map view; selection shown in the sidebar)
 * - `"board"`  — `/arch/:slug/board`         (pin-board view, MapCenter mounted in a slot)
 * - `"static"` — `/about`,`/privacy`,`/terms` (no map chrome)
 *
 * Selection and board are distinct URL axes: `/arch/:slug` selects an arch on
 * the home map; appending `/board` enters the pin-board for that arch.
 */
export function useLayout() {
  const { pathname } = useLocation()

  return useMemo(() => {
    const isBoard = /^\/arch\/[^/]+\/board$/.test(pathname)
    const layout: Layout =
      pathname.startsWith("/about") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms")
        ? "static"
        : isBoard
          ? "board"
          : "map"

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
