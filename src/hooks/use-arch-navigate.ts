import { useCallback } from "react"
import { useNavigate } from "react-router"
import { useArchDetailStore } from "@/stores/arch-detail"

export type NavMode = "push" | "replace"

/**
 * Selects an arch and navigates to `/arch/:slug` in one step.
 *
 * `mode` is the caller's intent:
 * - "push" always grows the back stack. Used by suggestion hops so Back
 *   retraces the exploration chain (A → B → C, Back = B → A → map).
 * - "replace" asks to overwrite the current slot. It only takes effect when a
 *   detail route is already open — otherwise we push, so entering detail from
 *   the map never replaces (and loses) the origin entry. Used by map-marker
 *   entry: Back escapes to the map instead of stepping through every pin.
 *
 * Navigation happens after `select` resolves so <ArchSync> sees the store
 * already holds this slug and early-returns — no second load, no double fly.
 */
export function useArchNavigate() {
  const select = useArchDetailStore((s) => s.select)
  const navigate = useNavigate()

  return useCallback(
    (slug: string, shouldFlyTo: boolean, mode: NavMode) => {
      const onDetail = window.location.pathname.startsWith("/arch/")
      void select(slug, shouldFlyTo).then((loaded) => {
        if (loaded) {
          navigate(`/arch/${slug}`, { replace: mode === "replace" && onDetail })
        }
      })
    },
    [select, navigate],
  )
}
