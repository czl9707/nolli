import { useMemo } from "react"
import { useLocation } from "react-router"

export type Layout = "map" | "board" | "static"

/**
 * Single source of truth for "which layout are we in", derived from the URL.
 *
 * - `"map"`    — `/`              (home map view, MapCenter mounted)
 * - `"board"`  — `/arch/:slug`    (board view, MapCenter mounted)
 * - `"static"` — `/about`,`/privacy`,`/terms` (no map chrome)
 *
 * Replaces the old `useLayoutStore.mode` + scattered `useLocation` checks.
 */
export function useLayout() {
  const { pathname } = useLocation()

  return useMemo(() => {
    const layout: Layout =
      pathname.startsWith("/about") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms")
        ? "static"
        : pathname.startsWith("/arch/")
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
