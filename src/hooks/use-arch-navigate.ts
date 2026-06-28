import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router"
import { useArchDetailStore } from "@/stores/arch-detail"

/**
 * Selects an arch and navigates to `/arch/:slug` in one step.
 *
 * History strategy: switching arches REPLACES the current slot, so the back
 * stack collapses — `home → arch1 → arch2` + Back lands on `home` (or `fav`
 * if that's where you started), not on `arch1`. Entering the arch view from a
 * non-arch page (home, fav) PUSHES, so you can still back out to the origin.
 *
 * Navigation happens after `select` resolves so <ArchSync> sees the store
 * already holds this slug and early-returns — no second load, no double fly.
 */
export function useArchNavigate() {
  const select = useArchDetailStore((s) => s.select)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return useCallback(
    (slug: string, shouldFlyTo: boolean) => {
      const replace = pathname.startsWith("/arch/")
      void select(slug, shouldFlyTo).then((loaded) => {
        if (loaded) navigate(`/arch/${slug}`, { replace })
      })
    },
    [select, navigate, pathname],
  )
}
