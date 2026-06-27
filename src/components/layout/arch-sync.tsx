import { useEffect } from "react"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayout } from "@/hooks/use-layout"

/**
 * Reconciles the selection store TO the URL (cold deep-link + browser
 * back/forward). Call sites navigate themselves after `select` resolves, so by
 * the time the URL change reaches here the store already holds that slug and
 * `select` early-returns — no loop, no duplicate load. The store never
 * navigates, so there's no store→URL→store cycle to guard against.
 */
export function ArchSync() {
  const { archSlug } = useLayout()
  const select = useArchDetailStore((s) => s.select)
  const deselect = useArchDetailStore((s) => s.deselect)

  useEffect(() => {
    if (archSlug) void select(archSlug, true)
    else deselect()
  }, [archSlug, select, deselect])

  return null
}
