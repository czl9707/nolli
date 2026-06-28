import { useEffect } from "react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayout } from "@/hooks/use-layout"

/**
 * Reconciles the selection store TO the URL (cold deep-link + browser
 * back/forward). Call sites navigate themselves after `select` resolves, so by
 * the time the URL change reaches here the store already holds that slug and
 * `select` early-returns — no loop, no duplicate load. The store never
 * navigates, so there's no store→URL→store cycle to guard against.
 *
 * The fly intent (`shouldFlyTo`) is only set on a cold deep-link, when nothing
 * is selected yet — that's when the map should pan to establish context. On
 * back/forward the store already holds a different arch, so restoring it should
 * NOT re-fly the map: the user is walking history, not picking a pin. Read via
 * `getState()` (not a subscription) so this effect stays keyed only on the slug.
 */
export function ArchSync() {
  const { archSlug } = useLayout()
  const select = useArchDetailStore((s) => s.select)
  const deselect = useArchDetailStore((s) => s.deselect)

  useEffect(() => {
    if (archSlug) {
      const shouldFlyTo = useArchDetailStore.getState().selected == null
      void select(archSlug, shouldFlyTo)
    } else {
      deselect()
    }
  }, [archSlug, select, deselect])

  return null
}
